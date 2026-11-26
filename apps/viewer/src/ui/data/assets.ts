import type { NwbtClient } from '../../api/browse'

/**
 * A path of the data as the archive has it: lowercase, forward slashes
 */
export function assetPath(path: string) {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase()
}

/**
 * The archive files of the paths that the data names
 */
export class AssetFinder {
  private readonly nwbt: NwbtClient
  private readonly found = new Map<string, Promise<string | null>>()

  public constructor(nwbt: NwbtClient) {
    this.nwbt = nwbt
  }

  /**
   * The archive file of a path of the data: as written, or the `.dds` of a `.png` or `.tif` (the data names images
   * by their source), null if the archive has neither
   */
  public find(path: string): Promise<string | null> {
    const id = assetPath(path)
    let result = this.found.get(id)
    if (!result) {
      result = (async () => {
        // images are in the archive as .dds, the source name is rarely there too
        const candidates = /.(png|tif)$/.test(id) ? [id.replace(/.[a-z]+$/, '.dds'), id] : [id]
        for (const candidate of candidates) {
          try {
            await this.nwbt.statFile(candidate)
            return candidate
          } catch {
            // next candidate
          }
        }
        return null
      })()
      this.found.set(id, result)
    }
    return result
  }
}
