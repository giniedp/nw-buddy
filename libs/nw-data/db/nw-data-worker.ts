import { wrap } from 'comlink'
import { NwData, NwDataOptions } from './nw-data'
export type { NwData, NwDataOptions } from './nw-data'

export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined'
}

export function nwData(options: NwDataOptions) {
  return new NwData(options)
}

export async function nwDataWorker(options: NwDataOptions): Promise<NwData> {
  const Constructor: any = wrap<NwData>(new Worker(new URL('./nw-data.worker', import.meta.url)))
  return new Constructor(options)
}
