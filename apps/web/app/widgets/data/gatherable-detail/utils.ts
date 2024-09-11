import { GatherableData } from '@nw-data/generated'
import { NW_TRADESKILLS_INFOS } from '~/nw/tradeskill'

const LOOT_TABLE_ICONS = {
  Death_Plant: 'death_plant_compass.png',
  Death_Stone: 'death_stone_compass.png',
  Death_Boid: 'death_boid_compass.png',

  Life_Plant: 'life_plant_compass.png',
  Life_Stone: 'life_stone_compass.png',
  Life_Boid: 'life_boid_compass.png',

  Earth_Plant: 'earth_plant_compass.png',
  Earth_Stone: 'earth_stone_compass.png',
  Earth_Boid: 'earth_boid_compass.png',

  Water_Plant: 'water_plant_compass.png',
  Water_Stone: 'water_stone_compass.png',
  Water_Boid: 'water_boid_compass.png',

  Air_Plant: 'wind_plant_compass.png',
  Air_Stone: 'wind_stone_compass.png',
  Air_Boid: 'wind_boid_compass.png',

  Fire_Plant: 'fire_plant_compass.png',
  Fire_Stone: 'fire_stone_compass.png',
  Fire_Boid: 'fire_boid_compass.png',

  Soul_Plant: 'spirit_plant_compass.png',
  Soul_Stone: 'spirit_stone_compass.png',
  Soul_Boid: 'spirit_boid_compass.png',
  // aloe_compass.png
  Aloe: 'aloe_compass.png',
  // brimstone_compass.png
  Brimstone: 'brimstone_compass.png',
  // starmetal_compass.png
  Starmetal: 'starmetal_compass.png',
  StarmetalOreVeinFinishSmall: 'starmetal_compass.png',
  StarmetalOreVeinFinishMedium: 'starmetal_compass.png',
  StarmetalOreVeinFinishLarge: 'starmetal_compass.png',
  OutpostRush_OreVeinSmall: 'starmetal_compass.png',
  OutpostRush_OreVeinMedium: 'starmetal_compass.png',
  OutpostRush_OreVeinLarge: 'starmetal_compass.png',
  // flintt1.png
  Flint: 'flintt1.png',
  Flint_Small: 'flintt1.png',
  Flint_Medium: 'flintt1.png',
  Flint_Large: 'flintt1.png',

  Single_Stone: 'flintt1.png',
  // gold_compass.png
  Gold: 'gold_compass.png',
  Gold_Small: 'gold_compass.png',
  Gold_Medium: 'gold_compass.png',
  Gold_Large: 'gold_compass.png',
  // iron_compass.png
  OreVeinFinishSmall: 'iron_compass.png',
  OreVeinFinishMedium: 'iron_compass.png',
  OreVeinFinishLarge: 'iron_compass.png',
  // mythril_compass.png
  Mythril: 'mythril_compass.png',
  MythrilOreVeinFinishSmall: 'mythril_compass.png',
  MythrilOreVeinFinishMedium: 'mythril_compass.png',
  MythrilOreVeinFinishLarge: 'mythril_compass.png',
  // orichalcum_compass.png
  Orichalcum: 'orichalcum_compass.png',
  OrichalcumOreVeinFinishSmall: 'orichalcum_compass.png',
  OrichalcumOreVeinFinishMedium: 'orichalcum_compass.png',
  OrichalcumOreVeinFinishLarge: 'orichalcum_compass.png',
  // platinum_compass.png
  Platinum: 'platinum_compass.png',
  Platinum_Small: 'platinum_compass.png',
  Platinum_Medium: 'platinum_compass.png',
  Platinum_Large: 'platinum_compass.png',
  // silver_compass.png
  Silver: 'silver_compass.png',
  Silver_Small: 'silver_compass.png',
  Silver_Medium: 'silver_compass.png',
  Silver_Large: 'silver_compass.png',
  // wyrdwood_compass.png
  Wyrdwood: 'wyrdwood_compass.png',
  WyrdwoodTreeSmall: 'wyrdwood_compass.png',
  WyrdwoodTreeMedium: 'wyrdwood_compass.png',
  WyrdwoodTreeLarge: 'wyrdwood_compass.png',
  // ironwood_compass.png
  Ironwood: 'ironwood_compass.png',
  IronwoodTreeTiny: 'ironwood_compass.png',
  IronwoodTreeSmall: 'ironwood_compass.png',
  IronwoodTreeMedium: 'ironwood_compass.png',
  IronwoodTreeLarge: 'ironwood_compass.png',
  IronwoodTreeHuge: 'ironwood_compass.png',
  // runewood_compass.png
  Runewood: 'runewood_compass.png',
  RunewoodTreeTiny: 'runewood_compass.png',
  RunewoodTreeSmall: 'runewood_compass.png',
  RunewoodTreeMedium: 'runewood_compass.png',
  RunewoodTreeLarge: 'runewood_compass.png',
  RunewoodTreeHuge: 'runewood_compass.png',
  OutpostRush_TreeTiny: 'runewood_compass.png',
  OutpostRush_TreeSmall: 'runewood_compass.png',
  OutpostRush_TreeMedium: 'runewood_compass.png',
  OutpostRush_TreeLarge: 'runewood_compass.png',
  OutpostRush_TreeHuge: 'runewood_compass.png',
  // oil_compass.png
  Oil: 'oil_compass.png',
  SeepingStoneSmall: 'oil_compass.png',
  SeepingStoneMedium: 'oil_compass.png',
  SeepingStoneLarge: 'oil_compass.png',
  // spinfiber_compass.png
  HempSmallT52: 'spinfiber_compass.png',
  HempMediumT52: 'spinfiber_compass.png',
  HempLargeT52: 'spinfiber_compass.png',
  // wirefiber_compass.png
  HempSmallT5: 'wirefiber_compass.png',
  HempMediumT5: 'wirefiber_compass.png',
  HempLargeT5: 'wirefiber_compass.png',
  // silkweed_compass.png
  HempSmallT4: 'silkweed_compass.png',
  HempMediumT4: 'silkweed_compass.png',
  HempLargeT4: 'silkweed_compass.png',
  // hemp_compass.png
  HempSmallT1: 'hemp_compass.png',
  HempMediumT1: 'hemp_compass.png',
  HempLargeT1: 'hemp_compass.png',
  // herb_compass.png
  Herb_Small: 'herb_compass.png',
  Herb_Medium: 'herb_compass.png',
  Herb_Large: 'herb_compass.png',
  // lodestone_compass.png
  Lodestone: 'lodestone_compass.png',
  LodestoneFinishSmall: 'lodestone_compass.png',
  LodestoneFinishMedium: 'lodestone_compass.png',
  LodestoneFinishLarge: 'lodestone_compass.png',
  // sandstone_compass.png
  Sandstone: 'sandstone_compass.png',
  SandstoneFinishSmall: 'sandstone_compass.png',
  SandstoneFinishMedium: 'sandstone_compass.png',
  SandstoneFinishLarge: 'sandstone_compass.png',
  // sporeplant_compass.png
  Ancient_SporePod: 'sporeplant_compass.png',
  AngryEarthElite_SporePod: 'sporeplant_compass.png',
  AngryEarth_SporePod: 'sporeplant_compass.png',
  BeastElite_SporePod: 'sporeplant_compass.png',
  Beasts_SporePod: 'sporeplant_compass.png',

  ArmadilloSkinning: 'armadillo_compass.png',
  //
  AlligatorSkinning: 'alligator_compass.png',
  AlligatorYoungSkinning: 'alligator_compass.png',
  //
  BearCorruptedSkinning: 'bear_compass.png',
  BearSkinning: 'bear_compass.png',
  //
  ElkSkinning: 'elk_compass.png',
  //
  CatSkinning: 'puma_compass.png',
  //
  FarmCow: 'cow_compass.png',
  //
  FarmPig: 'pig_compass.png',
  //
  Goat: 'sheep_compass.png',
  //
  Turkey: 'turkey_compass.png',
  //
  LargeBird: 'peacock_compass.png',
  //
  RabbitSkinning: 'hare_compass.png',
  BisonSkinning: 'bison_compass.png',
  BoarSkinning: 'boar_compass.png',
  Sheep: 'sheep_compass.png',
  //
  WolfCorruptedSkinning: 'wolf_compass.png',
  WolfSkinning: 'wolf_compass.png',
  //
  ScorpionLargeSkinning: 'scorpion_compass.png',
  ScorpionMediumSkinning: 'scorpion_compass.png',
  ScorpionSmallSkinning: 'scorpion_compass.png',

  //
  Nut_Small: 'nutt1.png',
}

const LOOT_TABLE_COLORS = {
  // spinfiber
  HempSmallT52: '#616bd9',
  HempMediumT52: '#616bd9',
  HempLargeT52: '#616bd9',
  // wirefiber
  HempSmallT5: '#cf8874',
  HempMediumT5: '#cf8874',
  HempLargeT5: '#cf8874',
  // silk
  HempSmallT4: '#769cd2',
  HempMediumT4: '#769cd2',
  HempLargeT4: '#769cd2',
  // hemp
  HempSmallT1: '#9f74b9',
  HempMediumT1: '#9f74b9',
  HempLargeT1: '#9f74b9',
  // herb
  // Herb_Small: 'herb_compass.png',
  // Herb_Medium: 'herb_compass.png',
  // Herb_Large: 'herb_compass.png',
  // wyrdwood_compass.png
  Wyrdwood: '#79937e',
  WyrdwoodTreeSmall: '#79937e',
  WyrdwoodTreeMedium: '#79937e',
  WyrdwoodTreeLarge: '#79937e',
  // ironwood_compass.png
  Ironwood: '#7a7066',
  IronwoodTreeTiny: '#7a7066',
  IronwoodTreeSmall: '#7a7066',
  IronwoodTreeMedium: '#7a7066',
  IronwoodTreeLarge: '#7a7066',
  IronwoodTreeHuge: '#7a7066',
  // runewood_compass.png
  Runewood: '#4b36a8',
  RunewoodTreeTiny: '#4b36a8',
  RunewoodTreeSmall: '#4b36a8',
  RunewoodTreeMedium: '#4b36a8',
  RunewoodTreeLarge: '#4b36a8',
  RunewoodTreeHuge: '#4b36a8',
  // starmetal_compass.png
  Starmetal: '#71bff1',
  StarmetalOreVeinFinishSmall: '#71bff1',
  StarmetalOreVeinFinishMedium: '#71bff1',
  StarmetalOreVeinFinishLarge: '#71bff1',
  OutpostRush_OreVeinSmall: '#71bff1',
  OutpostRush_OreVeinMedium: '#71bff1',
  OutpostRush_OreVeinLarge: '#71bff1',
  // flintt1.png
  Flint: '#3c3c3a',
  Flint_Small: '#3c3c3a',
  Flint_Medium: '#3c3c3a',
  Flint_Large: '#3c3c3a',

  Single_Stone: '#3c3c3a',
  // gold_compass.png
  Gold: '#b29968',
  Gold_Small: '#b29968',
  Gold_Medium: '#b29968',
  Gold_Large: '#b29968',
  // iron_compass.png
  OreVeinFinishSmall: '#6f6451',
  OreVeinFinishMedium: '#6f6451',
  OreVeinFinishLarge: '#6f6451',
  // mythril_compass.png
  Mythril: '#a67fb9',
  MythrilOreVeinFinishSmall: '#a67fb9',
  MythrilOreVeinFinishMedium: '#a67fb9',
  MythrilOreVeinFinishLarge: '#a67fb9',
  // orichalcum_compass.png
  Orichalcum: '#bb958b',
  OrichalcumOreVeinFinishSmall: '#bb958b',
  OrichalcumOreVeinFinishMedium: '#bb958b',
  OrichalcumOreVeinFinishLarge: '#bb958b',
  // platinum_compass.png
  Platinum: '#a7c4d4',
  Platinum_Small: '#a7c4d4',
  Platinum_Medium: '#a7c4d4',
  Platinum_Large: '#a7c4d4',
  // silver_compass.png
  Silver: '#323232',
  Silver_Small: '#323232',
  Silver_Medium: '#323232',
  Silver_Large: '#323232',
}
export function getGatherableIcon(gatherable: GatherableData) {
  if (!gatherable) {
    return null
  }

  let result = LOOT_TABLE_ICONS[gatherable.IconTypeUnlock] || LOOT_TABLE_ICONS[gatherable.FinalLootTable]
  if (result) {
    return `assets/icons/gatherables/${result}`
  }
  // result = NW_TRADESKILLS_INFOS.find((it) => it.ID === gatherable.Tradeskill)?.Icon
  // if (result) {
  //   return result
  // }
  return null
}

export function getGatherableColor(gatherable: GatherableData) {
  if (!gatherable) {
    return null
  }
  return LOOT_TABLE_COLORS[gatherable.IconTypeUnlock] || LOOT_TABLE_COLORS[gatherable.FinalLootTable]
}

export function getTradeskillIcon(tradeskill: string) {
  return NW_TRADESKILLS_INFOS.find((it) => it.ID === tradeskill)?.Icon
}
