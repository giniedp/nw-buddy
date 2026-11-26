import { For, Show } from 'solid-js'
import { BoolWidget, Button, Group, Icon, SelectWidget, Widget } from 'tweak-ui'
import type { ExportAction, ExportOptions } from '../../../api/export'
import svgDownload from '../../icons/download.svg?raw'
import { ModalDialog } from '../ModalDialog'
import {
  createExportButtonStore,
  createExportGroupsStore,
  type ExportButtonProps,
  type ExportGroupsStore,
} from './ExportButton.store'
import './ExportButton.css'

/**
 * Labels of the export options in the dialog, the descriptions of the config are their tooltips
 */
const OPTION_LABELS: Record<keyof ExportOptions, string> = {
  textures: 'Textures',
  textureSize: 'Texture size',
  yUp: 'Y up',
  blenderSpecular: 'Blender specular',
  quantize: 'Quantize',
  allLods: 'All LODs',
  keepNoDraw: 'Keep NoDraw',
}

/**
 * Opens the export dialog of a file, in two groups (see `exportActions`):
 * - Export: the options of the asset type (`exportOptionNames`) on top, the conversions by nwbt below
 * - Download: the files as stored, no options
 *
 * The options are saved for the browser session on every change (`exportConfig`).
 */
export function ExportButton(props: ExportButtonProps) {
  const store = createExportButtonStore(props)
  return (
    <>
      <Button
        ghost={props.ghost}
        accent={props.accent}
        square={props.square}
        title="Export: download the file, as stored or converted (png, glTF, glTF with DDS for Blender)"
        icon={<Icon svg={svgDownload} />}
        onClick={store.show}
      >
        {props.square ? null : (props.label ?? 'Export')}
      </Button>
      <ModalDialog title={`Export ${store.name()}`} open={store.open()} onClose={store.close}>
        {/* created on open: downloads of a closed dialog are aborted */}
        <Show when={store.open()}>
          <div class="nw-dialog-content nw-dialog-content-wide nw-export-content">
            <ExportGroups path={props.path} material={props.material} />
          </div>
        </Show>
      </ModalDialog>
    </>
  )
}

/**
 * Export (options, then the conversions) and Download (the files as stored). A group without actions is left out.
 */
function ExportGroups(props: { path: string; material?: string }) {
  const store = createExportGroupsStore(props)
  return (
    <>
      <Show when={store.exports().length}>
        <Group title="Export">
          <ExportOptionsForm store={store} />
          <ActionList store={store} items={store.exports()} />
        </Group>
      </Show>
      <Show when={store.downloads().length}>
        <Group title="Download">
          <ActionList store={store} items={store.downloads()} />
        </Group>
      </Show>
    </>
  )
}

/**
 * The options of the file's exports, only the ones that apply
 */
function ExportOptionsForm(props: { store: ExportGroupsStore }) {
  const store = props.store
  return (
    <Show when={store.optionNames().length}>
      <div class="nw-export-options">
        <For each={store.optionNames()}>
          {(name) => {
            const property = store.optionProperty(name)
            return (
              <div title={property.description}>
                <Show
                  when={property.kind === 'choice'}
                  fallback={
                    <BoolWidget
                      label={OPTION_LABELS[name]}
                      value={store.options()[name] as boolean}
                      onInput={(value) => store.setOption(name, value as never)}
                    />
                  }
                >
                  <SelectWidget
                    label={OPTION_LABELS[name]}
                    value={store.options()[name]}
                    onInput={(value) => store.setOption(name, value as never)}
                    options={property.kind === 'choice' ? [...property.options] : []}
                  />
                </Show>
              </div>
            )
          }}
        </For>
      </div>
    </Show>
  )
}

/**
 * Widget rows like the options: the description in the label column, the button and its status in the control column
 */
function ActionList(props: { store: ExportGroupsStore; items: ExportAction[] }) {
  const store = props.store
  return (
    <div class="nw-export-list">
      <For each={props.items}>
        {(item) => {
          const download = () => store.state.downloads[item.id]
          return (
            <div title={item.title}>
              <Widget label={item.title}>
                <div class="nw-export-action">
                  <Button
                    disabled={download()?.busy}
                    icon={<Icon svg={svgDownload} />}
                    onClick={() => store.start(item)}
                  >
                    {item.label}
                  </Button>
                  <span classList={{ 'nw-note': !download()?.error, 'nw-error': !!download()?.error }}>
                    {download()?.text}
                  </span>
                </div>
                <Show when={item.warning}>
                  <div class="nw-warning">{item.warning}</div>
                </Show>
              </Widget>
            </div>
          )
        }}
      </For>
    </div>
  )
}
