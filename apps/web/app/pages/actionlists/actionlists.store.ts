import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { ACTIONLISTS } from '@nw-data/generated'
import { switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { LoadedFile } from './types'

export interface ActionlistsState {
  files: string[]
  actionlists: LoadedFile[]
  selectedId: string
}

export const ActionlistsStore = signalStore(
  { providedIn: 'root' },
  withState<ActionlistsState>({
    files: listFiles(),
    actionlists: listSheets(),
    selectedId: '',
  }),
  withMethods((state) => {
    const db = injectNwData()
    return {
      select: rxMethod<string>(
        switchMap(async (id) => {
          const file = state.actionlists().find((s) => s.id === id)
          if (!file) {
            return
          }
          patchState(state, { selectedId: id })
          const content = await db.fetchText(file.url)
          const actionlists = state.actionlists().map((it) => {
            if (it.id !== id) {
              return it
            }
            return { ...it, content }
          })
          patchState(state, { actionlists })
        }),
      ),
    }
  }),
  withComputed(({ actionlists, selectedId }) => {
    return {
      selectedSheet: computed(() => {
        const id = selectedId()
        return actionlists().find((s) => s.id === id)
      }),
    }
  }),
)

function listFiles() {
  return ACTIONLISTS.map(getFileId)
}

function getFileId(url: string) {
  return url
    .replace(/^actionlists[\/\\]/, '')
    .replaceAll(/[\\/]+/g, '/')
    .toLowerCase()
}
function listSheets() {
  return ACTIONLISTS.map((url): LoadedFile => {
    return {
      id: getFileId(url),
      url,
      content: '',
    }
  })
}
