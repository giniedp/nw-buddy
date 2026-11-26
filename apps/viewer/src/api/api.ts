import type {
  CharacterAnimationSet,
  CharacterDatabase,
  LevelIndex,
  LevelInfo,
  RegionCapitalsData,
  RegionDistributionData,
  RegionInfo,
  RegionVegetationData,
} from './types'

export type TypedRequest<T> = {
  url: string
  type: 'json' | 'arraybuffer'
  __type?: T
}

export class NwbtApiClient {
  public readonly baseUrl: string

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl || ''
  }

  public async getLevelList() {
    return this.fetch(getLevelListUrl())
  }

  public async getLevelInfo(levelName: string) {
    return this.fetch(getLevelInfoUrl(levelName))
  }

  public async getRegionInfo(levelName: string, regionName: string) {
    return this.fetch(getRegionInfoUrl(levelName, regionName))
  }

  public async getRegionCapitals(levelName: string, regionName: string) {
    return this.fetch(getRegionCapitalsUrl(levelName, regionName))
  }

  public async fetch<T>(request: TypedRequest<T>): Promise<T> {
    return fetchTypedRequest(this.baseUrl, request)
  }
}

export async function fetchTypedRequest<T>(baseUrl: string, request: TypedRequest<T>): Promise<T> {
  return fetch((baseUrl || '') + request.url).then(async (it) => {
    if (!it.ok) {
      throw new Error(`Failed to fetch ${request.url}: ${it.status} ${it.statusText}`)
    }

    if (request.type === 'json') {
      return it.json() as Promise<T>
    }

    if (request.type === 'arraybuffer') {
      const buffer = await it.arrayBuffer()
      return buffer as any as T
    }

    throw new Error(`Unsupported request type: ${request.type}`)
  })
}

export function getRegionName(x: number, y: number): string {
  return `r_+${x.toString().padStart(2, '0')}_+${y.toString().padStart(2, '0')}`
}

/**
 * The animation set of a character (`.cdf` or `.chr`): skeleton, chrparams, events and the animations the chrparams
 * expand to, in game order (nwbt `/characters/animations`)
 */
export function getCharacterAnimationsUrl(model: string): TypedRequest<CharacterAnimationSet> {
  return { url: `/characters/animations?model=${encodeURIComponent(model)}`, type: 'json' }
}

/**
 * Every animation database with how many of its fragments the character (`.cdf` or `.chr`) can play, in path order
 * (nwbt `/characters/adbs`)
 */
export function getCharacterDatabasesUrl(model: string): TypedRequest<CharacterDatabase[]> {
  return { url: `/characters/adbs?model=${encodeURIComponent(model)}`, type: 'json' }
}

export function getLevelListUrl(): TypedRequest<LevelIndex> {
  return { url: `/levels/list.json`, type: 'json' }
}

/**
 * The level info of a coatlicue. `mission` names the level folder (`levels/<mission>`) when it differs from the
 * coatlicue, e.g. a main menu: coatlicue `nw_frontend_base` with the level `nw_frontend_nighthaven`.
 */
export function getLevelInfoUrl(levelName: string, mission?: string | null): TypedRequest<LevelInfo> {
  const query = mission ? `?level=${encodeURIComponent(mission)}` : ''
  return { url: `/levels/${levelName}/info.json${query}`, type: 'json' }
}

export function getRegionInfoUrl(levelName: string, regionName: string): TypedRequest<RegionInfo> {
  return { url: `/levels/${levelName}/${regionName}/info.json`, type: 'json' }
}

export function getRegionCapitalsUrl(levelName: string, regionName: string): TypedRequest<RegionCapitalsData> {
  return { url: `/levels/${levelName}/${regionName}/capitals.json`, type: 'json' }
}

/**
 * The capitals data in the `capitals.bin` layout, decode with `decodeRegionCapitalsBin`
 */
export function getRegionCapitalsBinUrl(levelName: string, regionName: string): TypedRequest<ArrayBuffer> {
  return { url: `/levels/${levelName}/${regionName}/capitals.bin`, type: 'arraybuffer' }
}

export function getRegionDistributionUrl(levelName: string, regionName: string): TypedRequest<RegionDistributionData> {
  return { url: `/levels/${levelName}/${regionName}/distribution.json`, type: 'json' }
}

export function getRegionDistributionDataUrl(levelName: string, regionName: string): TypedRequest<ArrayBuffer> {
  return { url: `/levels/${levelName}/${regionName}/distribution.bin`, type: 'arraybuffer' }
}

export function getRegionVegetationUrl(levelName: string, regionName: string): TypedRequest<RegionVegetationData> {
  return { url: `/levels/${levelName}/${regionName}/vegetation.json`, type: 'json' }
}

/**
 * The original region.vegetation file
 */
export function getRegionVegetationDataUrl(levelName: string, regionName: string): TypedRequest<ArrayBuffer> {
  return { url: `/levels/${levelName}/${regionName}/vegetation.bin`, type: 'arraybuffer' }
}

export function getRegionHeightmapUrl(levelName: string, regionName: string): TypedRequest<ArrayBuffer> {
  return { url: `/levels/${levelName}/${regionName}/heightmap.r16`, type: 'arraybuffer' }
}
