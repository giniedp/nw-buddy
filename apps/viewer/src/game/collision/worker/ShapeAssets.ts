import { parseRnr } from '../../../formats/rnr/parse'
import type { RnrAsset } from '../../../formats/rnr/types'

/**
 * Fetches and parses RockNRoll `.rnr` shape assets in the worker, cached by file path
 *
 * @remarks
 * Failed loads stay cached as rejected promises, so a broken asset is not fetched again.
 */
export class ShapeAssets {
  private readonly baseUrl: string
  private readonly cache = new Map<string, Promise<RnrAsset>>()

  /**
   * @param baseUrl - absolute url of the nwbt file endpoint (ends with `/files/`)
   */
  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  public load(path: string): Promise<RnrAsset> {
    let task = this.cache.get(path)
    if (!task) {
      task = this.fetch(path)
      this.cache.set(path, task)
    }
    return task
  }

  private async fetch(path: string): Promise<RnrAsset> {
    const url = new URL(path.replace(/^\/+/, ''), this.baseUrl)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    return parseRnr(await response.arrayBuffer())
  }
}
