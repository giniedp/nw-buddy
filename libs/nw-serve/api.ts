import { CatalogAssetInfo, DistributionInfo, EntityInfo, LevelInfo, RegionInfo, TerrainInfo } from './types'

export type TypedRequest<T> = {
  url: string
}

export class NwbtApiClient {
  public readonly baseUrl: string

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl || ''
  }

  public async getLevelInfo(levelName: string): Promise<LevelInfo> {
    return this.fetch(getLevelInfoUrl(levelName))
  }

  public async getRegionInfo(levelName: string, regionName: string): Promise<RegionInfo> {
    return this.fetch(getRegionInfoUrl(levelName, regionName))
  }

  public async getCapitalEntities(levelName: string, regionName: string, capitalId: string): Promise<EntityInfo[]> {
    return this.fetch(getCapitalEntities(levelName, regionName, capitalId))
  }

  public async getHeightmapInfo(levelName: string): Promise<TerrainInfo> {
    return this.fetch(getHeightmapInfoUrl(levelName))
  }

  public async fetch<T>(request: TypedRequest<T>): Promise<T> {
    return fetchTypedRequest(this.baseUrl, request)
  }
}

export async function fetchTypedRequest<T>(baseUrl: string, url: TypedRequest<T>): Promise<T> {
  return fetch((baseUrl || '') + url.url).then((it) => it.json())
}

export function getLevelsUrl(): TypedRequest<LevelInfo[]> {
  return { url: `/level` }
}

export function getLevelInfoUrl(levelName: string): TypedRequest<LevelInfo> {
  return { url: `/level/${levelName}` }
}

export function getLevelMissionUrl(levelName: string): TypedRequest<EntityInfo[]> {
  return { url: `/level/${levelName}/mission` }
}

export function getRegionInfoUrl(levelName: string, regionName: string): TypedRequest<RegionInfo> {
  return { url: `/level/${levelName}/region/${regionName}` }
}

export function getHeightmapInfoUrl(levelName: string): TypedRequest<TerrainInfo> {
  return { url: `/level/${levelName}/heightmap` }
}

export function getRegionEntitiesUrl(levelName: string, regionName: string): TypedRequest<Record<string, Record<string, EntityInfo[]>>> {
  return { url: `/level/${levelName}/region/${regionName}/entities` }
}

export function getRegionDistributionUrl(levelName: string, regionName: string): TypedRequest<DistributionInfo> {
  return { url: `/level/${levelName}/region/${regionName}/distribution` }
}

export function getCatalogAssetInfo(assetId: string): TypedRequest<CatalogAssetInfo> {
  return { url: `/catalog/${encodeURIComponent(assetId)}` }
}

export function getCapitalEntities(
  levelName: string,
  regionName: string,
  capitalId: string,
): TypedRequest<EntityInfo[]> {
  return { url: `/level/${levelName}/region/${regionName}/capital/${capitalId}` }
}
