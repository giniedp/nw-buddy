import { createEffect, createMemo, untrack } from 'solid-js'
import { createStore } from 'solid-js/store'
import { track } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { useApp } from '../../app/ViewerApp'
import type { DungeonMap } from '../../../game/catacombs/load'
import { coarseMapTiles, gameModeBounds, levelRect, type WorldRect } from './mapTiles'
import { fitView, panBy, worldAt, zoomAt, type MapSize } from './mapView'
import type { MinimapCamera, MinimapState } from './types'

/**
 * How often the camera position is sampled, in milliseconds
 */
const CAMERA_INTERVAL = 100

/**
 * Pixel size of a map tile: the tiles are coarse, a larger image keeps the zoomed map readable
 */
const TILE_PIXELS = 1024

/**
 * Pixel size of a dungeon map tile, the size of the game's images
 */
const DUNGEON_TILE_PIXELS = 256

/**
 * A pointer that moves farther than this, in pixels, pans: a shorter move is a click
 */
const DRAG_THRESHOLD = 4

/**
 * Zoom per wheel pixel
 */
const WHEEL_ZOOM = 0.0015

export type MinimapStore = ReturnType<typeof createMinimapStore>

/**
 * The minimap of the shown level: coarse map tiles, the region and segment grid, the camera. Zooms with the wheel,
 * pans with a drag, teleports the camera on a click.
 */
export function createMinimapStore(props: { viewer: NwViewer }) {
  const app = useApp()
  const level = track(() => props.viewer.levelInfo?.name ?? null, { interval: 500 })
  const camera = track(() => readCamera(props.viewer), { interval: CAMERA_INTERVAL, equals: sameCamera })
  // by reference: the default compare of `track` treats every object as changed, the view would be fitted again on
  // each poll
  const dungeon = track(() => props.viewer.dungeonMap, { interval: 500, equals: (a, b) => a === b })

  const [state, setState] = createStore<MinimapState>({
    level: null,
    rect: null,
    tiles: [],
    failed: 0,
    view: null,
    size: { width: 0, height: 0 },
    get camera() {
      return camera()
    },
    get dungeon() {
      return dungeon()
    },
    get dungeonTiles() {
      return dungeonTiles()
    },
  })
  const dungeonTiles = createMemo(() => {
    return (dungeon()?.cells ?? []).map((cell) => ({
      ...cell,
      url: app.nwbt.thumbnailUrl(cell.image, DUNGEON_TILE_PIXELS),
    }))
  })

  // a generated dungeon (the catacombs): the map shows it, fitted into the view
  createEffect(() => {
    const map = dungeon()
    untrack(() => {
      if (map && state.size.width) {
        setState('view', fitView(dungeonRect(map), state.size))
      }
    })
  })

  /**
   * What the view shows first: a generated dungeon, else the play area of the game mode, else the whole level
   */
  const initialRect = () => {
    // the viewer's, the polled one may still be the dungeon of the previous level
    const dungeonMap = props.viewer.dungeonMap
    if (dungeonMap) {
      return dungeonRect(dungeonMap)
    }
    const info = props.viewer.levelInfo
    return (info ? gameModeBounds(info) : null) ?? state.rect
  }

  // a new level: its tiles, fitted into the map. Only the level is tracked, a resize keeps the view.
  createEffect(() => {
    const name = level()
    untrack(() => {
      const info = props.viewer.levelInfo
      const rect = info ? levelRect(info) : null
      const tiles = rect ? coarseMapTiles(info.name.toLowerCase(), rect) : []
      setState({
        level: name,
        rect,
        tiles: tiles.map((it) => ({ ...it, url: app.nwbt.thumbnailUrl(it.path, TILE_PIXELS) })),
        failed: 0,
        view: null,
      })
      if (rect && state.size.width) {
        setState('view', fitView(initialRect(), state.size))
      }
    })
  })

  /**
   * The farthest zoom: the whole level and some margin
   */
  const maxMpp = () => {
    return state.rect ? fitView(state.rect, state.size).mpp * 1.5 : 1
  }

  let drag: { id: number; x: number; y: number; moved: boolean } | null = null

  return {
    state,
    /**
     * The map element changed its size
     */
    resize(size: MapSize) {
      setState('size', size)
      if (!state.view && state.rect && size.width) {
        setState('view', fitView(initialRect(), size))
      }
    },
    tileFailed() {
      setState('failed', (it) => it + 1)
    },
    wheel(e: WheelEvent) {
      e.preventDefault()
      if (!state.view) {
        return
      }
      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const factor = Math.exp(e.deltaY * WHEEL_ZOOM)
      setState(
        'view',
        zoomAt(state.view, state.size, e.clientX - bounds.left, e.clientY - bounds.top, factor, maxMpp()),
      )
    },
    pointerDown(e: PointerEvent) {
      if (e.button !== 0) {
        return
      }
      const element = e.currentTarget as HTMLElement
      element.setPointerCapture(e.pointerId)
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }
    },
    pointerMove(e: PointerEvent) {
      if (!drag || drag.id !== e.pointerId || !state.view) {
        return
      }
      const dx = e.clientX - drag.x
      const dy = e.clientY - drag.y
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        return
      }
      drag.moved = true
      drag.x = e.clientX
      drag.y = e.clientY
      setState('view', panBy(state.view, dx, dy))
    },
    /**
     * Ends a drag, or teleports the camera to the clicked position at its height and heading
     */
    pointerUp(e: PointerEvent) {
      if (!drag || drag.id !== e.pointerId) {
        return
      }
      const clicked = !drag.moved
      drag = null
      if (!clicked || !state.view || !state.rect) {
        return
      }
      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const target = worldAt(state.view, state.size, e.clientX - bounds.left, e.clientY - bounds.top)
      const location = props.viewer.cameraLocation()
      props.viewer.teleport(target.x, target.y, location.z, location.heading)
    },
    pointerCancel() {
      drag = null
    },
  }
}

/**
 * The world rectangle of the dungeon's cells, with a margin of one cell
 */
function dungeonRect(map: DungeonMap): WorldRect {
  const xs = map.cells.map((it) => it.x)
  const ys = map.cells.map((it) => it.y)
  const margin = map.tileSize * 1.5
  return {
    minX: Math.min(...xs) - margin,
    minY: Math.min(...ys) - margin,
    maxX: Math.max(...xs) + margin,
    maxY: Math.max(...ys) + margin,
  }
}

function readCamera(viewer: NwViewer): MinimapCamera | null {
  if (!viewer.levelInfo) {
    return null
  }
  const { x, y, z, look } = viewer.cameraLocation()
  return { x, y, z, lookX: look.x, lookY: look.y }
}

function sameCamera(a: MinimapCamera | null, b: MinimapCamera | null) {
  if (!a || !b) {
    return a === b
  }
  return (
    Math.abs(a.x - b.x) < 0.05 &&
    Math.abs(a.y - b.y) < 0.05 &&
    Math.abs(a.z - b.z) < 0.05 &&
    Math.abs(a.lookX - b.lookX) < 1e-3 &&
    Math.abs(a.lookY - b.lookY) < 1e-3
  )
}
