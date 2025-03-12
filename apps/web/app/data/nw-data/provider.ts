import { InjectionToken, inject, PendingTasks } from '@angular/core'
import { NwData, isWorkerSupported, nwData, nwDataWorker } from '@nw-data/db'
import { environment } from 'apps/web/environments'
import { CaseInsensitiveMap } from '~/utils'
import { WINDOW } from '~/utils/injection/window'
export type { NwData as NwDataBase, NwDataOptions } from '@nw-data/db'

export const NW_DATA_TOKEN = new InjectionToken<NwData>('NW_DATA_TOKEN', {
  providedIn: 'root',
  factory: () => createNwData(),
})

export function injectNwData(): NwData {
  return inject(NW_DATA_TOKEN)
}

function createNwData(): NwData {
  // need to wrap async calls in pending tasks
  // so that SSR engine knows when rendering is done
  // https://angular.dev/api/core/PendingTasks
  // https://angular.dev/guide/experimental/zoneless#pendingtasks-for-server-side-rendering-ssr
  const tasks = inject(PendingTasks)
  const runTask = async <T>(fn: () => Promise<T>) => {
    const cleanup = tasks.add()
    try {
      return await fn()
    } finally {
      cleanup()
    }
  }

  const options = {
    dataUrl: environment.nwDataUrl,
    imagesUrl: environment.nwImagesUrl,
    baseUrl: inject(WINDOW).location.origin,
  }
  const instance = isWorkerSupported() ? nwDataWorker(options) : Promise.resolve(nwData(options))
  const cached = memcache()
  return new Proxy({} as NwData, {
    get: (_, prop) => {
      return async (...args: any[]) => {
        if (prop === 'ngOnDestroy') {
          // during SSR the the service is teared down by calling ngOnDestroy
          // does not happen in the browser, because service lives forever
          return undefined
        }
        return runTask(async () => {
          if (args.length) {
            // do not cache methods with arguments
            // those are assumed to be lightweight
            // e.g. findById(id)
            const inst = await instance
            const value = await inst[prop](...args)
            return value
          }
          // everything else is assumed to be heavy
          // e.g. list or maps of items
          // to avoid sending data from worker to main thread multiple times
          // cache the result, especially because maps need to be converted
          // to CaseInsensitiveMap
          return cached(prop, args, async () => {
            const inst = await instance
            const value = await inst[prop](...args)
            if (value instanceof Map) {
              return new CaseInsensitiveMap(value)
            }
            return value
          })
        })
      }
    },
  })
}

function memcache() {
  const cache = new Map<string, any>()
  return (prop: string | symbol, args: any[], fn: () => any) => {
    const key = `${String(prop)}(${JSON.stringify(args)})`
    if (!cache.has(key)) {
      cache.set(key, fn())
    }
    return cache.get(key)
  }
}

function nocache() {
  return (prop: string | symbol, args: any[], fn: () => any) => {
    return fn()
  }
}
