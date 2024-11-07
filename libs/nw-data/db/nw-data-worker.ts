import { wrap } from 'comlink'
import type { NwData, NwDataOptions } from './nw-data'
export type { NwData, NwDataOptions } from './nw-data'

export async function nwDataWorker(options: NwDataOptions): Promise<NwData> {
  const Constructor: any = wrap<NwData>(new Worker(new URL('./nw-data.worker', import.meta.url)))
  return new Constructor(options)
}
