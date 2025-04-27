export interface LevelInfo {
  name: string
  oceanLevel: number
  mountainHeight: number
  groundMaterial: string
  regionSize: number
  regions: RegionReference[]
}

export interface RegionReference {
  name: string
  location: [number, number]
}

export interface RegionInfo {
  name: string
  size: number
  cellResolution: number
  poiImpostors: ImpostorInfo[]
  impostors: ImpostorInfo[]
  capitals: CapitalLayerInfo[]
}

export interface ImpostorInfo {
  position: [number, number]
  model: string
}

export interface DistributionInfo {
  slices: Record<string, EntityInfo[]>
  segments: Record<string, DistributionSlice[]>
}

export interface DistributionSlice {
  slice: string
  positions: number[][]
}

export interface CapitalLayerInfo {
  name: string
  capitals: CapitalInfo[]
}

export interface CapitalInfo {
  id: string
  transform: number[]
  radius: number
  slice: string
}

export interface EntityInfo {
  id: number
  name: string
  file: string
  transform: number[]
  model: string
  material: string
  instances: number[][]
  light: LightInfo
}

export interface LightInfo {
  type: number
  color: [number, number, number, number]
  diffuseIntensity: number
  specularIntensity: number
  pointDistance: number
  pointAttenuation: number
}

export interface TerrainInfo {
  level: string
  tileSize: number
  mipCount: number
  width: number
  height: number
  regionsX: number
  regionsY: number
  regionSize: number
  oceanLevel: number
  mountainHeight: number
  groundMaterial: string
}
