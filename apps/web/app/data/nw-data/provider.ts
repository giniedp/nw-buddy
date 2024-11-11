import { inject, InjectionToken } from '@angular/core'
import { NwData, nwDataWorker } from '@nw-data/db'
import { environment } from 'apps/web/environments'
import { CaseInsensitiveMap } from '~/utils'
export type { NwData as NwDataBase, NwDataOptions } from '@nw-data/db'

export const NW_DATA_TOKEN = new InjectionToken<NwData>('NW_DATA_TOKEN', {
  providedIn: 'root',
  factory: () => createNwData(),
})

export function injectNwData(): NwData {
  return inject(NW_DATA_TOKEN)
}

function memcache() {
  const cache = new Map<string, any>()
  return (prop: string | symbol, args: any[], fn: () => any) => {
    if (args.length) {
      return fn()
    }
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

function createNwData(): NwData {
  const instance = nwDataWorker({
    dataUrl: environment.nwDataUrl,
    imagesUrl: environment.cdnDataUrl,
  })
  const cached = memcache()
  return new Proxy({} as NwData, {
    get: (_, prop) => {
      return async (...args: any[]) => {
        return cached(prop, args, async () => {
          const inst = await instance
          const value = await inst[prop](...args)
          if (value instanceof Map) {
            return new CaseInsensitiveMap(value)
          }
          return value
        })
      }
    },
  })
}
