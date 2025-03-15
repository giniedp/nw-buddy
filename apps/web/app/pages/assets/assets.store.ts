import { HttpClient } from '@angular/common/http'
import { inject } from '@angular/core'
import { signalStore, withState } from '@ngrx/signals'
import { firstValueFrom } from 'rxjs'
import { withStateLoader } from '~/data'

export interface AssetsState {
  files: string[]
  selectedId: string
}

export const AssetsStore = signalStore(
  { providedIn: 'root' },
  withState<AssetsState>({
    files: null,
    selectedId: '',
  }),
  withStateLoader(() => {
    const http = inject(HttpClient)
    return {
      load: async (query: string) => {
        query = query || '**'
        const data = await firstValueFrom(http.get<string[]>('http://localhost:8000/list/' + query))
        return {
          files: data,
          selectedId: '',
        }
      },
    }
  }),
  // withMethods((state) => {
  //   const db = injectNwData()
  //   return {
  //     select: rxMethod<string>(
  //       switchMap(async (id) => {
  //         const file = state.datasheets().find((s) => s.id === id)
  //         if (!file) {
  //           return
  //         }
  //         patchState(state, { selectedId: id })
  //         const content = await db.fetchText(file.url)
  //         const datasheets = state.datasheets().map((it) => {
  //           if (it.id !== id) {
  //             return it
  //           }
  //           return { ...it, content }
  //         })
  //         patchState(state, { datasheets })
  //       }),
  //     ),
  //   }
  // }),
  // withComputed(({ datasheets, selectedId }) => {
  //   return {
  //     selectedSheet: computed(() => {
  //       const id = selectedId()
  //       return datasheets().find((s) => s.id === id)
  //     }),
  //   }
  // }),
)

// function listFiles() {
//   const files: Datasheet[] = []
//   for (const [name, group] of Object.entries(DATASHEETS)) {
//     for (const [type, { uri }] of Object.entries(group)) {
//       const urls = Array.isArray(uri) ? uri : [uri]
//       for (const url of urls) {
//         files.push({
//           id: url
//             .replace(/^datatables[\/\\]/, '')
//             .replaceAll(/[\\/]+/g, '/')
//             .toLowerCase(),
//           url,
//           type,
//           name,
//           filename: url.split('/').pop(),
//           content: '',
//         })
//       }
//     }
//   }
//   return files
// }
