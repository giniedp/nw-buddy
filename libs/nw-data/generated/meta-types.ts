export interface EncounterStage {
  name: string
  objectives: Array<any>
  stages: Array<EncounterStage>
}

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

export interface ScannedEmote {
  clips: Array<ScannedEmoteClip>
  id: string
}

export interface ScannedEmoteClip {
  file: string
  loop: boolean
}

export interface ScannedEncounter {
  encounterID: string
  name: string
  spawns: Array<ScannedEncounterSpawn>
  stages: Array<EncounterStage>
  tag: string
}

export interface ScannedEncounterSpawn {
  mapID: string
  positions: Array<[number,number]>
}

export interface ScannedEquipSocket {
  name: string
  position: [number,number,number]
  rotation: [number,number,number]
}

export interface ScannedEquipType {
  drawn: ScannedEquipSocket
  id: string
  offHandDrawn: ScannedEquipSocket
  offHandSheathed: ScannedEquipSocket
  sheathed: ScannedEquipSocket
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
  relatedModels: Array<string>
  spawns: Record<string, Array<ScannedVitalSpawn>>
  tables: Array<string>
  territories: Array<number>
  vitalsID: string
}

export interface ScannedVitalModel {
  adb: string
  cdf: string
  id: string
  model: string
  mtl: string
  overcoat: string
  spawnAction: string
  table: string
  tags: Array<string>
  vitalIds: Array<string>
  weaponTags: Array<string>
  weapons: Array<ScannedVitalWeapon>
}

export interface ScannedVitalSpawn {
  c: Array<string>
  e: Array<string>
  g: Array<string>
  l: Array<number>
  lc: number
  m: Array<number>
  p: Array<[number,number]>
  t: Array<number>
  tc: string
}

export interface ScannedVitalWeapon {
  equipType: string
  item: string
  mesh: string
  offHand: boolean
}

export interface ScannedZoneConfig {
  configName: string
  geometry: Array<Polygon>
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

