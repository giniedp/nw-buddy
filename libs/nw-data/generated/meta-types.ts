export interface Polygon {
  bbox: [number,number,number,number]
  coordinates: Array<Array<[number,number]>>
  type: string
}

export interface PositionChunkRef {
  chunkID: number
  elementCount: number
  elementOffset: number
  elementSize: number
}

export interface ScannedGatherable {
  gatherableID: string
  spawns: Array<ScannedGatherableSpawn>
}

export interface ScannedGatherableSpawn {
  encounter: string
  mapID: string
  positions: Array<[number,number]>
}

export interface ScannedHouse {
  houseTypeID: string
  mapID: string
  position: [number,number]
}

export interface ScannedHouseType {
  houseTypeID: string
  houses: Array<ScannedHouse>
}

export interface ScannedLore {
  loreID: string
  spawns: Array<ScannedLoreSpawn>
}

export interface ScannedLoreSpawn {
  mapID: string
  positions: Array<[number,number]>
}

export interface ScannedNpc {
  npcID: string
  spawns: Array<ScannedNpcSpawn>
}

export interface ScannedNpcSpawn {
  mapID: string
  positions: Array<[number,number]>
}

export interface ScannedSpell {
  AreaStatusEffects: Array<string>
  PrefabPath: string
}

export interface ScannedStation {
  mapID: string
  name: string
  position: [number,number]
  stationID: string
}

export interface ScannedStationType {
  stationID: string
  stations: Array<ScannedStation>
}

export interface ScannedStructure {
  mapID: string
  name: string
  position: [number,number]
  type: string
}

export interface ScannedStructureType {
  structures: Array<ScannedStructure>
  type: string
}

export interface ScannedTerritory {
  geometry: Array<Polygon>
  territoryID: string
}

export interface ScannedVariation {
  spawns: Array<ScannedVariationSpawn>
  variantID: string
}

export interface ScannedVariationSpawn {
  encounter: string
  mapID: string
  positions: PositionChunkRef
}

export interface ScannedVital {
  catIDs: Array<string>
  gthIDs: Array<string>
  levels: Array<number>
  mapIDs: Array<string>
  models: Array<string>
  spawns: Record<string, Array<ScannedVitalSpawn>>
  tables: Array<string>
  territories: Array<number>
  vitalsID: string
}

export interface ScannedVitalModel {
  adb: string
  cdf: string
  id: string
  mtl: string
  tags: Array<string>
  vitalIds: Array<string>
}

export interface ScannedVitalSpawn {
  c: Array<string>
  e: Array<string>
  g: Array<string>
  l: Array<number>
  m: Array<string>
  p: [number,number]
  t: Array<number>
}

export interface SearchItem {
  gs: string
  icon: string
  id: string
  named: boolean
  rarity: string
  subtype: string
  text: string
  tier: number
  type: string
}

