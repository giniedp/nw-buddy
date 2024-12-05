import { CraftingTradeskill, ProgressionCategory, TradeskillRankData } from '../generated/types'
import { EndsWithTrimmed, Equals } from './utils/ts-types'

export type TradeskillId = EndsWithTrimmed<ProgressionCategory, '_PostCap'> //| Equals<ProgressionCategory, 'Riding'>

export interface NwTradeSkillInfo {
  ID: CraftingTradeskill
  Category: string
  Icon: string
}

export const NW_TRADESKILLS_INFOS: Array<NwTradeSkillInfo> = [
  {
    ID: 'Weaponsmithing',
    Category: 'Crafting',
    Icon: 'assets/icons/tradeskills/weaponsmithing.png',
  },
  {
    ID: 'Armoring',
    Category: 'Crafting',
    Icon: 'assets/icons/tradeskills/armoring.png',
  },
  {
    ID: 'Engineering',
    Category: 'Crafting',
    Icon: 'assets/icons/tradeskills/engineering.png',
  },
  {
    ID: 'Jewelcrafting',
    Category: 'Crafting',
    Icon: 'assets/icons/tradeskills/jewelcrafting.png',
  },
  {
    ID: 'Arcana',
    Category: 'Crafting',
    Icon: 'assets/icons/tradeskills/arcana.png',
  },
  {
    ID: 'Cooking',
    Category: 'Crafting',
    Icon: 'assets/icons/tradeskills/cooking.png',
  },
  {
    ID: 'Furnishing',
    Category: 'Crafting',
    Icon: 'assets/icons/tradeskills/furnishing.png',
  },
  {
    ID: 'Smelting',
    Category: 'Refining',
    Icon: 'assets/icons/tradeskills/smelting.png',
  },
  {
    ID: 'Woodworking',
    Category: 'Refining',
    Icon: 'assets/icons/tradeskills/woodworking.png',
  },
  {
    ID: 'Leatherworking',
    Category: 'Refining',
    Icon: 'assets/icons/tradeskills/leatherworking.png',
  },
  {
    ID: 'Weaving',
    Category: 'Refining',
    Icon: 'assets/icons/tradeskills/weaving.png',
  },
  {
    ID: 'Stonecutting',
    Category: 'Refining',
    Icon: 'assets/icons/tradeskills/stonecutting.png',
  },
  {
    ID: 'Logging',
    Category: 'Gathering',
    Icon: 'assets/icons/tradeskills/logging.png',
  },
  {
    ID: 'Mining',
    Category: 'Gathering',
    Icon: 'assets/icons/tradeskills/mining.png',
  },
  {
    ID: 'Fishing',
    Category: 'Gathering',
    Icon: 'assets/icons/tradeskills/fishing.png',
  },
  {
    ID: 'Harvesting',
    Category: 'Gathering',
    Icon: 'assets/icons/tradeskills/harvesting.png',
  },
  {
    ID: 'Skinning',
    Category: 'Gathering',
    Icon: 'assets/icons/tradeskills/tracking.png',
  },
  {
    ID: 'Instruments' as CraftingTradeskill,
    Category: 'Casual',
    Icon: 'assets/icons/tradeskills/music.png',
  },
  {
    ID: 'Riding' as CraftingTradeskill,
    Category: 'Casual',
    Icon: '',
  },
]

export function getTradeskillRankRollBonus(skill: Pick<TradeskillRankData, 'RollBonus'>) {
  return (skill?.RollBonus || 0) / 10000
}
