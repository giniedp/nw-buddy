import { For, Match, Show, Switch } from 'solid-js'
import { Button, ButtonGroup, ScalarInput } from 'tweak-ui'
import type {
  TexturePreviewChannels,
  TexturePreviewProjection,
} from '../../../../graphics/passes/texture/TexturePreview.wgsl'
import { EngineSurface } from '../../../app/surface/EngineSurface'
import type { AssetViewProps } from '../registry'
import { createTextureModeStore } from './TextureMode.store'
import './TextureMode.css'

const CHANNELS: { value: TexturePreviewChannels; label: string; title: string }[] = [
  { value: 'rgba', label: 'RGBA', title: 'Color over a checkerboard by alpha' },
  { value: 'rgb', label: 'RGB', title: 'Color, alpha ignored' },
  { value: 'r', label: 'R', title: 'Red channel' },
  { value: 'g', label: 'G', title: 'Green channel' },
  { value: 'b', label: 'B', title: 'Blue channel' },
  { value: 'alpha', label: 'A', title: 'Alpha (or the .dds.a texture)' },
]

const PROJECTIONS: { value: TexturePreviewProjection; label: string; title: string }[] = [
  { value: 'sphere', label: 'Sphere', title: 'The cubemap on a sphere, by direction. Drag to rotate.' },
  { value: 'cube', label: 'Cube', title: 'The cubemap on a cube, by direction. Drag to rotate.' },
  { value: 'faces', label: 'Faces', title: 'One face at a time' },
]

/**
 * A `.dds` (or `.dds.a`) rendered by the engine: mip, face or slice, channels, fit, 1:1, wheel zoom at the cursor and
 * drag to pan. The texture is assembled from its split files in the frontend (D6) and uploaded as stored.
 */
export default function TextureMode(props: AssetViewProps) {
  const store = createTextureModeStore(props)
  const { state } = store

  // wheel zoom at the cursor, drag to pan, double click fits
  let drag: { x: number; y: number } | null = null
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    store.zoomAt((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, -e.deltaY)
  }
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) {
      return
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!drag) {
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    store.dragBy((e.clientX - drag.x) / rect.width, (e.clientY - drag.y) / rect.height)
    drag = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = () => {
    drag = null
  }

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Assembling the texture…</p>
        </div>
      }
    >
      <Match when={state.loadError}>
        <div class="nw-empty">
          <p class="nw-note">The texture could not be assembled: {state.loadError}</p>
        </div>
      </Match>
      <Match when={state.facts}>
        {(tex) => (
          <div class="nw-texture">
            <div class="nw-view-bar">
              <ButtonGroup>
                <For each={CHANNELS}>
                  {(c) => (
                    <Button
                      ghost
                      active={state.channels === c.value}
                      title={c.title}
                      onClick={() => store.setChannels(c.value)}
                    >
                      {c.label}
                    </Button>
                  )}
                </For>
              </ButtonGroup>
              <Show when={tex().mips > 1}>
                <ScalarInput
                  class="nw-texture-slider"
                  value={state.mip}
                  min={0}
                  max={tex().mips - 1}
                  step={1}
                  decimals={0}
                  range
                  slotBefore={<span class="nw-view-label">mip</span>}
                  unit={state.mipSize}
                  onInput={store.setMip}
                />
              </Show>
              <Show when={tex().cubemap}>
                <ButtonGroup>
                  <For each={PROJECTIONS}>
                    {(p) => (
                      <Button
                        ghost
                        active={state.projection === p.value}
                        title={p.title}
                        onClick={() => store.setProjection(p.value)}
                      >
                        {p.label}
                      </Button>
                    )}
                  </For>
                </ButtonGroup>
              </Show>
              <Show when={state.layers > 1}>
                <ScalarInput
                  class="nw-texture-slider"
                  value={state.layer}
                  min={0}
                  max={state.layers - 1}
                  step={1}
                  decimals={0}
                  range
                  slotBefore={<span class="nw-view-label">{state.layerLabel}</span>}
                  onInput={store.setLayer}
                />
              </Show>
              <ButtonGroup>
                <Button ghost title="Fit into the view and reset the rotation (double click)" onClick={store.fit}>
                  Fit
                </Button>
                <Button ghost title="One texel per pixel" onClick={store.actualSize}>
                  1:1
                </Button>
                <Button
                  ghost
                  active={state.encoded}
                  title="The values are linear: encode them for the display (on for sRGB and float formats)"
                  onClick={store.toggleEncode}
                >
                  sRGB
                </Button>
              </ButtonGroup>
              <span class="nw-view-info nw-push-end">{state.info}</span>
            </div>
            <EngineSurface
              class="nw-texture-surface"
              active={props.shown}
              onRunning={store.attach}
              onDetach={store.detach}
            >
              <Show when={state.error}>
                <div class="nw-empty nw-texture-error">
                  <p class="nw-note">The texture can not be shown: {state.error}</p>
                </div>
              </Show>
              <div
                class="nw-texture-input"
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDblClick={store.fit}
              />
            </EngineSurface>
          </div>
        )}
      </Match>
    </Switch>
  )
}
