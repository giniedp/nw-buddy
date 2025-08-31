import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { DATASHEETS } from '@nw-data/generated'
import { switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { LoadedFile } from './types'

export interface DatasheetsState {
  files: string[]
  datasheets: LoadedFile[]
  selectedId: string
}

export const DatasheetsStore = signalStore(
  { providedIn: 'root' },
  withState<DatasheetsState>({
    files: listFiles(),
    datasheets: listSheets(),
    selectedId: '',
  }),
  withMethods((state) => {
    const db = injectNwData()
    return {
      select: rxMethod<string>(
        switchMap(async (id) => {
          const file = state.datasheets().find((s) => s.id === id)
          if (!file) {
            return
          }
          patchState(state, { selectedId: id })
          const content = await db.fetchText(file.url)
          const datasheets = state.datasheets().map((it) => {
            if (it.id !== id) {
              return it
            }
            return { ...it, content }
          })
          patchState(state, { datasheets })
        }),
      ),
    }
  }),
  withComputed(({ datasheets, selectedId }) => {
    return {
      selectedSheet: computed(() => {
        const id = selectedId()
        return datasheets().find((s) => s.id === id)
      }),
    }
  }),
)

function getFileId(url: string) {
  return url
    .replace(/^datatables[\/\\]/, '')
    .replaceAll(/[\\/]+/g, '/')
    .toLowerCase()
}

function listFiles() {
  const files: string[] = []
  for (const [name, group] of Object.entries(DATASHEETS)) {
    for (const [type, { uri }] of Object.entries(group)) {
      const urls = Array.isArray(uri) ? uri : [uri]
      for (const url of urls) {
        files.push(getFileId(url))
      }
    }
  }
  return files
}

function listSheets() {
  const files: LoadedFile[] = []
  for (const [name, group] of Object.entries(DATASHEETS)) {
    for (const [type, { uri }] of Object.entries(group)) {
      const urls = Array.isArray(uri) ? uri : [uri]
      for (const url of urls) {
        files.push({
          id: getFileId(url),
          url,
          content: '',
        })
      }
    }
  }
  return files
}
