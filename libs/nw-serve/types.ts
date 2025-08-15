export interface LevelInfo {
  name: string
  oceanLevel: number
  mountainHeight: number
  groundMaterial: string
  regionSize: number
  regions: RegionReference[]
  maps: MapInfo[]
  timeOfDay: TimeOfDay
}

export interface TimeOfDay {
  time: number
  timeStart: number
  timeEnd: number
  timeAnimSpeed: number
  variables: TimeOfDayVariable[]
}
export interface TimeOfDayVariable {
  name: string
  color: string
  value: string
}
export interface MapInfo {
  gameModeMapId: string
  gameModeId: string
  slicePath: string
  coatlicueName: string
  worldBounds: string
  teamTeleportData: string
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
  chunks: ChunkInfo[]
}

export interface CapitalInfo {
  id: string
  transform: number[]
  radius: number
  slice: string
}

export interface ChunkInfo {
  id: string
  transform: number[]
  size: number
  slice: string
}

export interface EntityInfo {
  id: string
  name: string
  file: string
  transform: number[]
  model: string
  material: string
  instances: number[][]
  light: LightInfo
  vital: VitalSpawnInfo
  encounter: string
  encounterName: string
  maxViewDistance: number
  layer: string
}

export interface VitalSpawnInfo {
  vitalsId: string
  categoryId: string
  level: number
  adbFile: string
  statusEffects: string[]
  tags: string[]
  damageTable: string
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
  regionMaterials: RegionMacroMaterial[]
}

export interface CatalogAssetInfo {
  asset: AssetInfo
  assets: AssetInfo[]
}

export interface AssetInfo {
  guid: string
  subId: number
  type: string
  file: string
  size: number
}

export interface RegionMacroMaterial {
  regionsX: number
  regionsY: number
  normalMap: string
  colorMap: string
  specularMap: string
}
