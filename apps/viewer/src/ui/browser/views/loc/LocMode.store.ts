import type { GridApi } from 'ag-grid-community'
import { createMemo, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import { parseLocXml, type LocString } from '../../../../formats/loc/loc'
import type { AssetViewProps } from '../registry'
import type { LocModeState } from './types'

export type LocModeStore = ReturnType<typeof createLocModeStore>

/**
 * The state and actions of the localization table: parses the `.loc.xml` of the tab, filters the grid
 */
export function createLocModeStore(props: AssetViewProps) {
  const app = props.ctx.app
  const [loaded] = createResource(
    () => props.ctx.path,
    async (path) => parseLocXml(new TextDecoder().decode(await app.files.contentBytes(path))),
  )
  // reading a failed resource throws: guard every read
  const strings = createMemo(() => (loaded.error ? undefined : loaded()))
  const keyChars = createMemo(() => longestKey(strings() ?? []))

  const [state] = createStore<LocModeState>({
    get loadError() {
      return loaded.error ? String(loaded.error) : null
    },
    get ready() {
      return !!strings()
    },
    get count() {
      return `${(strings()?.length ?? 0).toLocaleString()} strings`
    },
    get keyChars() {
      return keyChars()
    },
  })

  let grid: GridApi<LocString> | undefined

  return {
    state,
    /**
     * The strings, the rows of the grid. Not part of the state: ag-grid gets the plain objects.
     */
    rows: () => strings() ?? [],
    setGrid(api: GridApi<LocString>) {
      grid = api
    },
    filter(text: string) {
      grid?.setGridOption('quickFilterText', text)
    },
  }
}

/**
 * The characters of the longest key. A loop: a spread into Math.max overflows the stack for large files.
 */
export function longestKey(rows: LocString[]) {
  let chars = 0
  for (const row of rows) {
    chars = Math.max(chars, row.key.length)
  }
  return chars
}
