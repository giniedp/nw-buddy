export interface LevelData {
  meta: LevelMetadata
  regions: RegionMetadata[]
  heightmap: HeightmapMetadata
}

export interface LevelMetadata {
  name: string
  missionEntitiesFile: string

  tracts: TractsData
  playableArea: Array<[number, number]>
  worldArea: Array<[number, number]>
  regions: RegionReference[]
}

export interface RegionReference {
  name: string
  location: [number, number]
}

export interface HeightmapMetadata {
  name: string
  width: number
  height: number
  tileSize: number
  mipCount: number
  regionSize: number
  regionsX: number
  regionsY: number
}

export interface RegionMetadata {
  name: string
  localMappings: any
  mapSettings: Mapsettings
  impostors: Impostor[]
  poiImpostors: Impostor[]
  capitals: Capital[]
  chunks: string
  distribution: string
  heightmap: string
  metadata: string
  slicedata: string
  tractmap: string
}

export interface Mapsettings {
  cellResolution: number
  regionSize: number
  regionType: number
}

export interface Impostor {
  cellIndex: number
  meshAssetId: string
  worldPosition: {
    x: number
    y: number
  }
}

export interface Capital {
  id: string
  scale?: number
  worldPosition?: {
    x: number
    y: number
    z: number
  }
  rotation?: {
    x: number
    y: number
    z: number
    w: number
  }
  footprint: {
    type: string
    id: string
    radius: number
  }
  sliceName: string
  sliceAssetId: string
}

export interface Chunk {
  cellindex: {
    x: number
    y: number
    z: number
  }
  size: number
  spawnradius: number
  layer: string
  worldposition: number[]
  chunktype: number
  assetid: {
    guid: string
  }
}

export interface TractsData {
  tractmapCellSize: number
  heightmapCellSize: number
  regionSize: number
  territoryMasterSlicePath: string
  regions: TractRegion[]
  forcedRegions: TractForcedRegion[]
  persistedCapitalsWhitelist: string[]
  claimWhitelist: string[]
  azureWellWhitelist: string[]
}

export interface TractRegion {
  name: string
  spawnManifests: string[]
}

export interface TractForcedRegion {
  location: { x: number; y: number }
  regionName: string
}
