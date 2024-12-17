import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { isEqual } from 'lodash'
import { withStateLoader } from '~/data'
import { DataWithVersion } from '~/ui/code-editor'
import { DiffToolService } from './diff-tool.service'
import { DiffResource, diffResourceFor } from './types'

export interface DiffToolState {
  current: any
  versions: DataWithVersion[]
}

export const DiffToolStore = signalStore(
  withState<DiffToolState>({
    current: null,
    versions: [],
  }),
  withStateLoader((state) => {
    const service = inject(DiffToolService)
    return {
      async load(resource: DiffResource<any>) {
        const current = cleanRecord(resource.record)
        const versions = await service.getResourceVersions(resource).then((list) => {
          return list.map((item) => {
            return {
              data: cleanRecord(item.data),
              version: item.version,
            }
          })
        })
        return {
          current,
          versions,
        }
      },
    }
  }),
  withMethods((state) => {
    return {
      loadRecord<T>(record: T, idKey: keyof T) {
        patchState(state, { current: cleanRecord(record), versions: [] })
        state.load(diffResourceFor(record, [idKey]))
      },
    }
  }),
  withComputed(({ current, versions }) => {
    const currentDocument = computed(() => JSON.stringify(current(), null, 2))
    const hasHistory = computed(() => versions()?.length > 0)
    const history = computed(() => {
      if (!hasHistory()) {
        return []
      }
      return collapseHistory([
        // {
        //   data: current(),
        //   version: 'current',
        // },
        ...versions(),
      ])
    })
    return {
      currentDocument,
      hasHistory,
      history,
    }
  }),
)

function cleanRecord(record: any): any {
  if (!record) {
    return record
  }
  record = JSON.parse(JSON.stringify(record))
  for (const key of Object.keys(record)) {
    if (key.startsWith('$')) {
      // internal meta fields
      delete record[key]
      continue
    }
    let value = record[key]
    if (typeof value !== 'string') {
      continue
    }
    if (value.startsWith('@')) {
      // trim leading '@' from all localizable strings
      record[key] = value.slice(1)
      continue
    }

    if (key.includes('Icon')) {
      // the icon path did change a lot in the past for nw-buddy internal logic
      // normalize here
      if (value.startsWith('nw-data/icons')) {
        record[key] = value.replace('nw-data/', 'lyshineui/images/')
        continue
      }
      if (value.includes('lyshineui') && !value.startsWith('lyshineui')) {
        const index = value.indexOf('lyshineui')
        record[key] = value.slice(index)
        continue
      }
    }
  }
  return record
}

function collapseHistory(nodes: DataWithVersion[]) {
  if (!nodes?.length) {
    return []
  }
  return nodes.filter((current, i, arr) => {
    const prev = arr[i + 1]
    if (!prev || !i) {
      return true
    }
    return !isEqual(current.data, prev.data)
  })
}
