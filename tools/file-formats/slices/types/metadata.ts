export interface RegionMetadataAsset {
  __type: string
  npcdata: Array<NPCData>
  aispawnlocations: Array<AISpawnLocation>
  gatherablelocations: Array<GatherableRegionEntry>
  territorylandmarks: Array<TerritoryLandmarkData>
  encounterlocations: Array<EncounterEntry>
  loredata: Array<TerritoryLoreData>
}
export function isRegionMetadataAsset(obj: any): obj is RegionMetadataAsset {
  return obj?.['__type'] === 'RegionMetadataAsset'
}

export interface AISpawnLocation {
  __type: string
  vitalsid: Crc32
  vitalscategoryid: Crc32
  vitalslevel: number
  worldposition: Array<number>
  spawnedbycoatlicue: boolean
  isunderterrain: boolean
  isalias: boolean
  isoverride: boolean
  isencounter: boolean
}
export function isAISpawnLocation(obj: any): obj is AISpawnLocation {
  return obj?.['__type'] === 'AISpawnLocation'
}

export interface Crc32 {
  __type: string
  value: number
}
export function isCrc32(obj: any): obj is Crc32 {
  return obj?.['__type'] === 'Crc32'
}

export interface GatherableRegionEntry {
  __type: string
  gatherableid: Crc32
  loottableid: string
  worldposition: Array<number>
  spawnedbycoatlicue: boolean
  hasvariant: boolean
  isvariantoverride: boolean
  instancedloottype: number
  isencounter: boolean
}
export function isGatherableRegionEntry(obj: any): obj is GatherableRegionEntry {
  return obj?.['__type'] === 'GatherableRegionEntry'
}

export interface TerritoryLandmarkData {
  __type: string
  landmarktype: number
  landmarkdata: string
  worldposition: Array<number>
  radius: number
  actorid: string
}
export function isTerritoryLandmarkData(obj: any): obj is TerritoryLandmarkData {
  return obj?.['__type'] === 'TerritoryLandmarkData'
}

export interface NPCData {
  __type: string
  npcid: Crc32
  worldposition: Array<number>
  factiontype: number
  swapachievementid: string
  showonachievementlocked: boolean
  disablepvpmissions: boolean
}
export function isNPCData(obj: any): obj is NPCData {
  return obj?.['__type'] === 'NPCData'
}

export interface EncounterEntry {
  __type: string
  encounterid: string
  worldposition: Array<number>
  '0xf4a4c322': Crc32
}
export function isEncounterEntry(obj: any): obj is EncounterEntry {
  return obj?.['__type'] === 'EncounterEntry'
}

export interface TerritoryLoreData {
  __type: string
  loreid: Crc32
  worldposition: Array<number>
}
export function isTerritoryLoreData(obj: any): obj is TerritoryLoreData {
  return obj?.['__type'] === 'TerritoryLoreData'
}
