import { For, Show, onCleanup, onMount } from 'solid-js'
import { REGION_SIZE, SEGMENT_SIZE } from '../../../constants'
import type { NwViewer } from '../../../viewer'
import { createMinimapStore } from './Minimap.store'
import { gridLines, screenX, screenY, worldAt } from './mapView'
import './Minimap.css'

/**
 * Pixel size of the gutters along the top and the left edge
 */
const GUTTER = 14

/**
 * Segment lines show once a segment is at least this many pixels wide
 */
const MIN_SEGMENT_PIXELS = 8

/**
 * The minimap of the shown level: a click teleports the camera, the wheel zooms, a drag pans
 */
export function Minimap(props: { viewer: NwViewer }) {
  const store = createMinimapStore(props)
  const state = store.state
  let element!: HTMLDivElement

  onMount(() => {
    const observer = new ResizeObserver(() => {
      store.resize({ width: element.clientWidth, height: element.clientHeight })
    })
    observer.observe(element)
    onCleanup(() => observer.disconnect())
  })

  const sx = (x: number) => screenX(state.view!, state.size, x)
  const sy = (y: number) => screenY(state.view!, state.size, y)
  const px = (meters: number) => meters / state.view!.mpp
  // top of the bottom gutter
  const bottom = () => state.size.height - GUTTER

  // the part of the level in view
  const visible = () => {
    const rect = state.rect!
    const topLeft = worldAt(state.view!, state.size, 0, 0)
    const bottomRight = worldAt(state.view!, state.size, state.size.width, state.size.height)
    return {
      minX: Math.max(rect.minX, topLeft.x),
      maxX: Math.min(rect.maxX, bottomRight.x),
      minY: Math.max(rect.minY, bottomRight.y),
      maxY: Math.min(rect.maxY, topLeft.y),
    }
  }
  const showSegments = () => px(SEGMENT_SIZE) >= MIN_SEGMENT_PIXELS
  const regionLinesX = () => gridLines(visible().minX, visible().maxX, REGION_SIZE)
  const regionLinesY = () => gridLines(visible().minY, visible().maxY, REGION_SIZE)
  const segmentLinesX = () => (showSegments() ? gridLines(visible().minX, visible().maxX, SEGMENT_SIZE) : [])
  const segmentLinesY = () => (showSegments() ? gridLines(visible().minY, visible().maxY, SEGMENT_SIZE) : [])
  // region indices, labeled at the centers of the regions in view
  const regionIndicesX = () => {
    return gridLines(visible().minX - REGION_SIZE / 2, visible().maxX - REGION_SIZE / 2, REGION_SIZE).map(
      (it) => it / REGION_SIZE,
    )
  }
  const regionIndicesY = () => {
    return gridLines(visible().minY - REGION_SIZE / 2, visible().maxY - REGION_SIZE / 2, REGION_SIZE).map(
      (it) => it / REGION_SIZE,
    )
  }

  return (
    <div
      ref={element}
      class="nw-minimap"
      onWheel={store.wheel}
      onPointerDown={store.pointerDown}
      onPointerMove={store.pointerMove}
      onPointerUp={store.pointerUp}
      onPointerCancel={store.pointerCancel}
    >
      <Show when={state.rect && state.view} fallback={<div class="nw-minimap-empty nw-muted">No level</div>}>
        <For each={state.tiles}>
          {(tile) => (
            <img
              class="nw-minimap-tile"
              src={tile.url}
              alt=""
              draggable={false}
              style={{
                left: `${sx(tile.minX)}px`,
                top: `${sy(tile.minY + tile.size)}px`,
                width: `${px(tile.size)}px`,
                height: `${px(tile.size)}px`,
              }}
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden'
                store.tileFailed()
              }}
            />
          )}
        </For>
        <svg class="nw-minimap-overlay" width={state.size.width} height={state.size.height}>
          <For each={segmentLinesX()}>
            {(x) => (
              <line class="nw-minimap-segment" x1={sx(x)} x2={sx(x)} y1={sy(visible().maxY)} y2={sy(visible().minY)} />
            )}
          </For>
          <For each={segmentLinesY()}>
            {(y) => (
              <line class="nw-minimap-segment" x1={sx(visible().minX)} x2={sx(visible().maxX)} y1={sy(y)} y2={sy(y)} />
            )}
          </For>
          <For each={regionLinesX()}>
            {(x) => (
              <line class="nw-minimap-region" x1={sx(x)} x2={sx(x)} y1={sy(visible().maxY)} y2={sy(visible().minY)} />
            )}
          </For>
          <For each={regionLinesY()}>
            {(y) => (
              <line class="nw-minimap-region" x1={sx(visible().minX)} x2={sx(visible().maxX)} y1={sy(y)} y2={sy(y)} />
            )}
          </For>

          <Show when={state.camera}>
            {(camera) => {
              const length = () => Math.hypot(camera().lookX, camera().lookY)
              return (
                <g class="nw-minimap-camera">
                  <Show when={length() > 1e-3}>
                    <line
                      x1={sx(camera().x)}
                      y1={sy(camera().y)}
                      x2={sx(camera().x) + (camera().lookX / length()) * 14}
                      y2={sy(camera().y) - (camera().lookY / length()) * 14}
                    />
                  </Show>
                  <circle cx={sx(camera().x)} cy={sy(camera().y)} r={4} />
                </g>
              )
            }}
          </Show>

          {/* gutters on the bottom (x) and the left (y): region indices, region and segment ticks */}
          <rect class="nw-minimap-gutter" x={0} y={bottom()} width={state.size.width} height={GUTTER} />
          <rect class="nw-minimap-gutter" x={0} y={0} width={GUTTER} height={state.size.height} />
          <For each={segmentLinesX()}>
            {(x) => <line class="nw-minimap-tick" x1={sx(x)} x2={sx(x)} y1={bottom()} y2={bottom() + 3} />}
          </For>
          <For each={segmentLinesY()}>
            {(y) => <line class="nw-minimap-tick" x1={GUTTER - 3} x2={GUTTER} y1={sy(y)} y2={sy(y)} />}
          </For>
          <For each={regionLinesX()}>
            {(x) => <line class="nw-minimap-tick-strong" x1={sx(x)} x2={sx(x)} y1={bottom()} y2={state.size.height} />}
          </For>
          <For each={regionLinesY()}>
            {(y) => <line class="nw-minimap-tick-strong" x1={0} x2={GUTTER} y1={sy(y)} y2={sy(y)} />}
          </For>
          <For each={regionIndicesX()}>
            {(index) => (
              <text class="nw-minimap-label" x={sx((index + 0.5) * REGION_SIZE)} y={bottom() + GUTTER / 2}>
                {index}
              </text>
            )}
          </For>
          <For each={regionIndicesY()}>
            {(index) => (
              <text class="nw-minimap-label" x={GUTTER / 2} y={sy((index + 0.5) * REGION_SIZE)}>
                {index}
              </text>
            )}
          </For>
          <rect class="nw-minimap-gutter-corner" x={0} y={bottom()} width={GUTTER} height={GUTTER} />
        </svg>
        <Show when={state.tiles.length === 0 || state.failed >= state.tiles.length}>
          <div class="nw-minimap-note nw-muted">No map for this level</div>
        </Show>
      </Show>
    </div>
  )
}
