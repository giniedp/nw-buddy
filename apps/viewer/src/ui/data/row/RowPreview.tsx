import { createSignal, For, onCleanup, Show } from 'solid-js'
import { Button, Icon, SelectInput } from 'tweak-ui'
import { EngineSurface } from '../../app/surface/EngineSurface'
import { ExportButton } from '../../common/export/ExportButton'
import svgCamera from '../../icons/camera-viewfinder.svg?raw'
import svgCompress from '../../icons/compress.svg?raw'
import svgExpand from '../../icons/expand.svg?raw'
import { createRowPreviewStore, fileStem, type RowPreviewProps } from './RowPreview.store'
import './RowPreview.css'

/**
 * Keeps the wheel over the engine for the camera: without it the row panel scrolls as well. The listener must not be
 * passive to cancel the scroll; the engine still gets the event.
 */
function stopWheelScroll(el: HTMLElement) {
  el.addEventListener('wheel', (e) => e.preventDefault(), { passive: false })
}

/**
 * The models of a row rendered by the engine: the options of the row (its own models, the appearances it references)
 * in a dropdown, the blend masks of an appearance applied. The engine shows one content at a time (pak browser D5): the
 * preview unloads the level, the viewer opens it again.
 */
export function RowPreview(props: RowPreviewProps) {
  const store = createRowPreviewStore(props)

  // full screen is the element's: the view follows the document
  let container: HTMLDivElement | undefined
  const [fullscreen, setFullscreen] = createSignal(false)
  const onFullscreenChange = () => setFullscreen(!!container && document.fullscreenElement === container)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  onCleanup(() => document.removeEventListener('fullscreenchange', onFullscreenChange))
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void container?.requestFullscreen()
    }
  }

  return (
    <Show when={store.options().length}>
      {/* picking an option starts a new preview, which clears `touched` again */}
      <div class="nw-data-preview" ref={(el) => (container = el)} onPointerDown={store.touch} onWheel={store.touch}>
        {/* the wheel zooms the camera, it must not scroll the row panel */}
        <div class="nw-data-preview-wheel" ref={stopWheelScroll}>
          <EngineSurface
            class="nw-data-preview-surface"
            active={props.shown}
            onRunning={store.attach}
            onDetach={store.detach}
          />
          <div class="nw-data-preview-overlay">
            <Button
              square
              title="Point the camera at the models again"
              icon={<Icon svg={svgCamera} />}
              onClick={store.resetCamera}
            />
            <Button
              square
              title={fullscreen() ? 'Leave full screen' : 'Full screen'}
              icon={<Icon svg={fullscreen() ? svgCompress : svgExpand} />}
              onClick={toggleFullscreen}
            />
          </div>
        </div>
        <div class="nw-view-bar">
          <Show when={store.options().length > 1}>
            <span class="nw-data-preview-select" title={store.option()?.source}>
              <SelectInput
                value={store.selectedIndex()}
                options={store.selectOptions()}
                onChange={(value) => store.select(Number(value))}
              />
            </span>
          </Show>
          {/* the export of the browser, per file of the option: the materials as authored, without the masks */}
          <span class="nw-data-preview-exports">
            <For each={store.exportFiles()}>
              {(file) => (
                <ExportButton
                  accent
                  path={file.path}
                  material={file.material}
                  label={store.exportFiles().length > 1 ? `Export ${fileStem(file.path)}` : 'Export'}
                />
              )}
            </For>
          </span>
        </div>
      </div>
    </Show>
  )
}
