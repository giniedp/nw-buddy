import { Polygon } from 'geojson'

export type ScannedGatherableData = ScannedGatherable[]
export interface ScannedGatherable {
  gatherableID: string
  spawns: ScannedGatherableSpawn[]
}
export interface ScannedGatherableSpawn {
  mapID: string
  randomEncounter: boolean
  positions: Array<[number, number]>
}

export type ScannedLoreData = ScannedLore[]
export interface ScannedLore {
  loreID: string
  spawns: ScannedLoreSpawn[]
}
export interface ScannedLoreSpawn {
  mapID: string
  positions: Array<[number, number]>
}

export type SannedNpcData = ScannedNpc[]
export interface ScannedNpc {
  npcID: string
  spawns: ScannedNpcSpawn[]
}
export interface ScannedNpcSpawn {
  mapID: string
  positions: Array<[number, number]>
}

export type ScannedSpellData = ScannedSpell[]
export interface ScannedSpell {
  AreaStatusEffects: string[]
  PrefabPath: string
}

export type ScannedTerritoryData = ScannedTerritory[]
export interface ScannedTerritory {
  territoryID: string
  geometry: Polygon[]
}

export type ScannedVariationData = ScannedVariation[]
export interface ScannedVariation<T = PositionChunkRef> {
  variantID: string
  spawns: Array<ScannedVariationSpawn<T>>
}
export interface ScannedVariationSpawn<T = PositionChunkRef> {
  mapID: string
  randomEncounter: boolean
  positions: T
}
export interface PositionChunkRef {
  chunkID: number
  elementCount: number
  elementOffset: number
  elementSize: number
}

export type ScannedVitalData = ScannedVital[]
export interface ScannedVital {
  catIDs: string[]
  gthIDs: string[]
  levels: number[]
  spawns: Record<string, ScannedVitalSpawn[]>
  mapIDs: string[]
  models: string[]
  tables: string[]
  territories: number[]
  vitalsID: string
}

export interface ScannedVitalSpawn {
  c: string[]
  g: string[]
  l: number[]
  m: string[]
  p: number[]
  r: boolean
  t: number[]
}

export type ScannedVitalModelData = ScannedVitalModel[]
export interface ScannedVitalModel {
  adb: string
  cdf: string
  id: string
  mtl: string
  tags: string[]
  vitalIds: string[]
}
