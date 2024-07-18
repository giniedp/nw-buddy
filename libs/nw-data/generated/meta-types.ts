export interface GatherablesMetadata {
  gatherableID: string;
  mapIDs: string[];
  spawns: Spawns;
}

export interface Spawns {
  climaxftue_02?: Array<number[]>;
  newworld_vitaeeterna?: Array<number[]>;
  nw_arena01?: Array<number[]>;
  nw_arena02?: Array<number[]>;
  nw_dungeon_brimstonesands_00?: Array<number[]>;
  nw_dungeon_cutlasskeys_00?: Array<number[]>;
  nw_dungeon_edengrove_00?: Array<number[]>;
  nw_dungeon_everfall_00?: Array<number[]>;
  nw_dungeon_firstlight_01?: Array<number[]>;
  nw_dungeon_greatcleave_00?: Array<number[]>;
  nw_dungeon_greatcleave_01?: Array<number[]>;
  nw_dungeon_reekwater_00?: Array<number[]>;
  nw_dungeon_restlessshores_01?: Array<number[]>;
  nw_dungeon_shattermtn_00?: Array<number[]>;
  nw_dungeon_windsward_00?: Array<number[]>;
  nw_ori_eg_questmotherwell?: Array<number[]>;
  nw_ori_er_questliang?: Array<number[]>;
  nw_ori_fl_questadiana?: Array<number[]>;
  nw_ori_gc_questnihilo?: Array<number[]>;
  nw_ori_sm_questisabella?: Array<number[]>;
  nw_trial_season_02?: Array<number[]>;
  nw_trial_season_04?: Array<number[]>;
  nw_trial_season_04_daichidojo?: Array<number[]>;
  nw_trial_season_04_deviceroom?: Array<number[]>;
}
export interface LoreMetadata {
  loreID: string;
  loreSpawns: LoreSpawns;
  mapIDs: string[];
}

export interface LoreSpawns {
  newworld_vitaeeterna?: Array<number[]>;
  nw_dungeon_brimstonesands_00?: Array<number[]>;
  nw_dungeon_cutlasskeys_00?: Array<number[]>;
  nw_dungeon_edengrove_00?: Array<number[]>;
  nw_dungeon_everfall_00?: Array<number[]>;
  nw_dungeon_greatcleave_00?: Array<number[]>;
  nw_dungeon_greatcleave_01?: Array<number[]>;
  nw_dungeon_reekwater_00?: Array<number[]>;
  nw_dungeon_restlessshores_01?: Array<number[]>;
  nw_dungeon_shattermtn_00?: Array<number[]>;
  nw_dungeon_windsward_00?: Array<number[]>;
}
export interface NpcsMetadata {
  mapIDs: string[];
  npcId: string;
  spawns: Spawns;
}

export interface Spawns {
  climaxftue_02?: Array<number[]>;
  newworld_vitaeeterna?: Array<number[]>;
  nw_dungeon_cutlasskeys_00?: Array<number[]>;
  nw_dungeon_edengrove_00?: Array<number[]>;
  nw_dungeon_everfall_00?: Array<number[]>;
  nw_dungeon_reekwater_00?: Array<number[]>;
  nw_dungeon_restlessshores_01?: Array<number[]>;
  nw_dungeon_shattermtn_00?: Array<number[]>;
  nw_ori_fl_questadiana?: Array<number[]>;
  nw_trial_season_04_daichidojo?: Array<number[]>;
}
export interface SpellsMetadata {
  AreaStatusEffects: string[];
  PrefabPath: string;
}
export interface TerritoriesMetadata {
  territoryID: string;
  zones: Zone[];
}

export interface Zone {
  max: number[];
  min: number[];
  shape: Array<number[]>;
}
export interface VariationsMetadata {
  mapIDs: string[];
  variantID: string;
  variantPositions: VariantPosition[];
}

export interface VariantPosition {
  chunk: number;
  elementCount: number;
  elementOffset: number;
  elementSize: number;
  mapId: string;
}
export interface VitalsMetadata {
  catIDs: string[];
  gthIDs: string[];
  levels: number[];
  lvlSpanws: LvlSpanws;
  mapIDs: string[];
  models: string[];
  tables: string[];
  territories: number[];
  vitalsID: string;
}

export interface LvlSpanws {
  climaxftue_02?: Climaxftue02[];
  newworld_vitaeeterna?: Climaxftue02[];
  nw_dungeon_brimstonesands_00?: Climaxftue02[];
  nw_dungeon_cutlasskeys_00?: Climaxftue02[];
  nw_dungeon_edengrove_00?: Climaxftue02[];
  nw_dungeon_everfall_00?: Climaxftue02[];
  nw_dungeon_firstlight_01?: Climaxftue02[];
  nw_dungeon_greatcleave_00?: Climaxftue02[];
  nw_dungeon_greatcleave_01?: Climaxftue02[];
  nw_dungeon_reekwater_00?: Climaxftue02[];
  nw_dungeon_restlessshores_01?: Climaxftue02[];
  nw_dungeon_shattermtn_00?: Climaxftue02[];
  nw_dungeon_windsward_00?: Climaxftue02[];
  nw_ori_eg_questmotherwell?: Climaxftue02[];
  nw_ori_er_questliang?: Climaxftue02[];
  nw_ori_fl_questadiana?: Climaxftue02[];
  nw_ori_gc_questnihilo?: Climaxftue02[];
  nw_ori_sm_questisabella?: Climaxftue02[];
  nw_trial_season_02?: Climaxftue02[];
  nw_trial_season_04?: Climaxftue02[];
  nw_trial_season_04_daichidojo?: Climaxftue02[];
  nw_trial_season_04_deviceroom?: Climaxftue02[];
}

export interface Climaxftue02 {
  c: string[];
  g: string[];
  l: number[];
  m: string[];
  p: number[];
  t: number[];
}
export interface VitalsModelsMetadata {
  adb: string;
  cdf: string;
  id: string;
  mtl: string;
  tags: string[];
  vitalIds: string[];
}
