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

function createNwData(): NwData {
  const instance = nwDataWorker({
    dataUrl: environment.nwDataUrl,
    imagesUrl: environment.cdnDataUrl,
  })
  return new Proxy({} as NwData, {
    get: (_, prop) => {
      return async (...args: any[]) => {
        const inst = await instance
        const value = await inst[prop](...args)
        if (value instanceof Map) {
          return new CaseInsensitiveMap(value)
        }
        return value
      }
    },
  })
}
