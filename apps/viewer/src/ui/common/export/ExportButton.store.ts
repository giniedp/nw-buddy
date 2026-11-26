import { createMemo, createSignal, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import {
  downloadExport,
  exportActions,
  exportOptionNames,
  type ExportAction,
  type ExportOptions,
} from '../../../api/export'
import { exportConfig } from '../../../config'
import { useApp } from '../../app/ViewerApp'
import { configValue } from '../reactive'
import { exportAnimations } from '../exportSelection'
import type { ExportGroupsState } from './types'

export interface ExportButtonProps {
  path: string
  /**
   * Material that overrides the model's own (`.cgf`, `.skin`), e.g. the one of an entity
   */
  material?: string
  ghost?: boolean
  /**
   * Highlighted with the accent color
   */
  accent?: boolean
  /**
   * Icon only, e.g. next to a field
   */
  square?: boolean
  /**
   * The text of the button, default "Export"
   */
  label?: string
}

/**
 * The dialog of the export button
 */
export function createExportButtonStore(props: ExportButtonProps) {
  const [open, setOpen] = createSignal(false)
  return {
    open,
    /**
     * The file name, for the title of the dialog
     */
    name: () => props.path.split('/').pop() ?? props.path,
    show() {
      setOpen(true)
    },
    close() {
      setOpen(false)
    },
  }
}

export type ExportGroupsStore = ReturnType<typeof createExportGroupsStore>

/**
 * The exports of a file: the options of its type, the actions (Export: conversions by nwbt, Download: the files as
 * stored) and the status of each download. Created when the dialog opens: closing it aborts the downloads.
 */
export function createExportGroupsStore(props: { path: string; material?: string }) {
  const app = useApp()
  const config = exportConfig()
  const options = exportOptions()
  const actions = createMemo(() =>
    exportActions(app, props.path, options(), props.material, exportAnimations(props.path)),
  )
  const [state, setState] = createStore<ExportGroupsState>({ downloads: {} })
  const abort = new AbortController()
  onCleanup(() => abort.abort())

  return {
    state,
    options,
    /**
     * The options of the file's exports, only the ones that apply
     */
    optionNames: () => exportOptionNames(props.path),
    optionProperty<K extends keyof ExportOptions>(name: K) {
      return config.schema[name]
    },
    setOption<K extends keyof ExportOptions>(name: K, value: ExportOptions[K]) {
      config.set(name, value as never)
    },
    /**
     * The conversions by nwbt. Not part of the state: actions hold their requests.
     */
    exports: () => actions().filter((it) => it.group === 'export'),
    /**
     * The files as stored
     */
    downloads: () => actions().filter((it) => it.group === 'download'),
    start(item: ExportAction) {
      setState('downloads', item.id, { busy: true, text: 'Converting…', error: false })
      downloadExport(
        item,
        (loaded, total) =>
          setState('downloads', item.id, { busy: true, text: progressText(loaded, total), error: false }),
        abort.signal,
      ).then(
        () => setState('downloads', item.id, undefined),
        (err) => {
          if (!abort.signal.aborted) {
            setState('downloads', item.id, { busy: false, text: String(err?.message ?? err), error: true })
          }
        },
      )
    },
  }
}

/**
 * The current export options, reactive. The options are saved for the browser session on every change.
 */
function exportOptions(): () => ExportOptions {
  const config = exportConfig()
  const textures = configValue(config, 'textures')
  const textureSize = configValue(config, 'textureSize')
  const yUp = configValue(config, 'yUp')
  const blenderSpecular = configValue(config, 'blenderSpecular')
  const quantize = configValue(config, 'quantize')
  const allLods = configValue(config, 'allLods')
  const keepNoDraw = configValue(config, 'keepNoDraw')
  return () => ({
    textures: textures(),
    textureSize: textureSize(),
    yUp: yUp(),
    blenderSpecular: blenderSpecular(),
    quantize: quantize(),
    allLods: allLods(),
    keepNoDraw: keepNoDraw(),
  })
}

/**
 * The progress of a download: percent when the size is known, else the bytes loaded
 */
export function progressText(loaded: number, total: number | undefined): string {
  if (total) {
    return `${Math.round((loaded / total) * 100)}%`
  }
  if (loaded < 1024 * 1024) {
    return `${Math.round(loaded / 1024)} KB`
  }
  return `${(loaded / 1024 / 1024).toFixed(1)} MB`
}
