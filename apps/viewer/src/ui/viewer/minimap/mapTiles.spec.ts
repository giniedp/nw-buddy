import { describe, expect, it } from 'vitest'
import { coarseMapTiles, gameModeBounds, levelRect } from './mapTiles'
import { fitView, gridLines, panBy, screenX, screenY, worldAt, zoomAt } from './mapView'

describe('gameModeBounds', () => {
  it('reads x, y, width, height', () => {
    const rect = gameModeBounds({ gameModeMaps: [{ worldBounds: ['768.0', '1280.0', '672.0', '672.0'] }] })
    expect(rect).toEqual({ minX: 768, minY: 1280, maxX: 1440, maxY: 1952 })
  })
  it('is null without bounds or when the maps disagree', () => {
    expect(gameModeBounds({ gameModeMaps: [] })).toBeNull()
    expect(
      gameModeBounds({
        gameModeMaps: [{ worldBounds: ['0', '0', '64', '64'] }, { worldBounds: ['100', '0', '64', '64'] }],
      }),
    ).toBeNull()
  })
})

describe('levelRect', () => {
  it('spans the regions', () => {
    const rect = levelRect({
      regionSize: 2048,
      regions: [{ location: [0, 0] }, { location: [7, 6] }, { location: [3, 2] }],
    })
    expect(rect).toEqual({ minX: 0, minY: 0, maxX: 16384, maxY: 14336 })
  })
})

describe('coarseMapTiles', () => {
  it('covers the open world with 2 x 2 level 6 tiles', () => {
    const tiles = coarseMapTiles('newworld_vitaeeterna', { minX: 0, minY: 0, maxX: 16384, maxY: 14336 })
    expect(tiles.map((it) => it.path)).toEqual([
      'lyshineui/worldtiles/newworld_vitaeeterna/map_l6_y000_x000.webp',
      'lyshineui/worldtiles/newworld_vitaeeterna/map_l6_y000_x032.webp',
      'lyshineui/worldtiles/newworld_vitaeeterna/map_l6_y032_x000.webp',
      'lyshineui/worldtiles/newworld_vitaeeterna/map_l6_y032_x032.webp',
    ])
    expect(tiles[3]).toMatchObject({ minX: 8192, minY: 8192, size: 8192 })
  })

  it('covers a single region with 2 x 2 level 3 tiles', () => {
    const tiles = coarseMapTiles('nw_dungeon_shattermtn_00', { minX: 0, minY: 0, maxX: 2048, maxY: 2048 })
    expect(tiles.map((it) => it.path)).toEqual([
      'lyshineui/worldtiles/nw_dungeon_shattermtn_00/map_l3_y000_x000.webp',
      'lyshineui/worldtiles/nw_dungeon_shattermtn_00/map_l3_y000_x004.webp',
      'lyshineui/worldtiles/nw_dungeon_shattermtn_00/map_l3_y004_x000.webp',
      'lyshineui/worldtiles/nw_dungeon_shattermtn_00/map_l3_y004_x004.webp',
    ])
  })
})

describe('map view', () => {
  const size = { width: 200, height: 100 }
  const rect = { minX: 0, minY: 0, maxX: 2048, maxY: 2048 }

  it('fits the rectangle, north up', () => {
    const view = fitView(rect, size)
    expect(view).toEqual({ cx: 1024, cy: 1024, mpp: 20.48 })
    expect(screenY(view, size, 2048)).toBe(0)
    expect(screenY(view, size, 0)).toBe(100)
    expect(screenX(view, size, 1024)).toBe(100)
  })

  it('maps pixels back to the world', () => {
    const view = fitView(rect, size)
    const world = worldAt(view, size, 150, 25)
    expect(screenX(view, size, world.x)).toBeCloseTo(150)
    expect(screenY(view, size, world.y)).toBeCloseTo(25)
  })

  it('zooms around the cursor', () => {
    const view = fitView(rect, size)
    const before = worldAt(view, size, 30, 70)
    const zoomed = zoomAt(view, size, 30, 70, 0.5, 100)
    expect(zoomed.mpp).toBeCloseTo(10.24)
    const after = worldAt(zoomed, size, 30, 70)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('clamps the zoom', () => {
    const view = fitView(rect, size)
    expect(zoomAt(view, size, 0, 0, 1e-6, 100).mpp).toBe(0.25)
    expect(zoomAt(view, size, 0, 0, 100, 40).mpp).toBe(40)
  })

  it('pans with the drag', () => {
    const view = { cx: 100, cy: 100, mpp: 2 }
    // dragging right and down shows what is west and north
    expect(panBy(view, 10, 5)).toEqual({ cx: 80, cy: 110, mpp: 2 })
  })

  it('lists grid lines', () => {
    expect(gridLines(100, 4200, 2048)).toEqual([2048, 4096])
    expect(gridLines(0, 2048, 2048)).toEqual([0, 2048])
  })
})
