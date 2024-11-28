import {
  CraftingIngredientType,
  CraftingRecipeData,
  GameEventData,
  HouseItems,
  MasterItemDefinitions,
  TradeskillRankData,
} from '@nw-data/generated'
import { sum } from 'lodash'
import { NW_MAX_CRAFT_GEAR_SCORE, NW_MAX_TRADESKILL_LEVEL } from './constants'
import { isMasterItem } from './item'

export type CraftingIngredients = Pick<
  CraftingRecipeData,
  | 'Qty1'
  | 'Qty2'
  | 'Qty3'
  | 'Qty4'
  | 'Qty5'
  | 'Qty6'
  | 'Qty7'
  | 'Ingredient1'
  | 'Ingredient2'
  | 'Ingredient3'
  | 'Ingredient4'
  | 'Ingredient5'
  | 'Ingredient6'
  | 'Ingredient7'
  | 'Type1'
  | 'Type2'
  | 'Type3'
  | 'Type4'
  | 'Type5'
  | 'Type6'
  | 'Type7'
>

const NW_CRAFTING_GROUP_NAMES = {
  Alkahest: 'CategoryData_Alkahest',
  LargeFurnishings: 'CategoryData_LargeFurnishings',
  SmallFurnishings: 'CategoryData_SmallFurnishings',
  MeleeWeapons: 'CategoryData_MeleeWeapons',
  RangedWeapons: 'CategoryData_RangedWeapons',
  Trophies: 'CategoryData_Trophies',
  Potion: 'CategoryData_Potion',
  Metal: 'Metal_CategoryName',
  MetalPrecious: 'MetalPrecious_CategoryName',
  AttributeDex: 'AttributeDex',
  AttributeCon: 'AttributeCon',
  AttributeFoc: 'AttributeFoc',
  AttributeInt: 'AttributeInt',
  AttributeStr: 'AttributeStr',
  SalvageCreate: 'SalvageCreate',
  SalvageResearch: 'SalvageResearch',
  SalvageExtract: 'SalvageExtract',
  PatternRecipes: 'PatternRecipes',
  Keys: 'KeyParts_groupname',
}
const NW_CRAFTING_CATEGORY_NAMES = {
  TimelessShardsCon: 'TimelessShardsCon',
  TimelessShardsDex: 'TimelessShardsDex',
  TimelessShardsFoc: 'TimelessShardsFoc',
  TimelessShardsInt: 'TimelessShardsInt',
  TimelessShardsStr: 'TimelessShardsStr',
  Salvage: 'Salvage',
  SalvageCreate: 'SalvageCreate',
  Pattern: 'Pattern',
  Keys: 'KeyParts_groupname',
  CorruptedRefining: 'CorruptedRefinement_GroupName',
  Bags: 'CategoryData_Bags',
  Tools: 'inv_tools',
  Dyes: 'CategoryData_Dyes',
}

export function sumCraftingIngredientQuantities(recipe: CraftingIngredients, multiplier = 1) {
  if (!recipe) {
    return 0
  }
  let sum = 0
  for (const key in recipe) {
    if (!key.match(/^Qty\d+$/)) {
      continue
    }
    const num = Number(key.replace('Qty', ''))
    const type = recipe[`Type${num}`]
    if (type === 'Currency') {
      continue
    }
    sum += Math.floor((recipe[key] || 0) * multiplier)
  }
  return sum
}

export function getCraftingIngredients(recipe: CraftingIngredients) {
  return Object.keys(recipe || {})
    .filter((it) => it.match(/^Ingredient\d+$/))
    .map((_, i) => {
      return {
        ingredient: recipe[`Ingredient${i + 1}`] as string,
        quantity: recipe[`Qty${i + 1}`] as number,
        type: recipe[`Type${i + 1}`] as CraftingIngredientType,
      }
    })
}

export function getCraftingSkillXP(recipe: CraftingIngredients, event: GameEventData) {
  if (!event?.CategoricalProgressionReward || !recipe) {
    return 0
  }
  return sumCraftingIngredientQuantities(recipe, event.CategoricalProgressionReward || 0)
}

export function getCraftingStandingXP(recipe: CraftingIngredients, event: GameEventData, scale = 1) {
  if (!recipe || !event?.TerritoryStanding) {
    return 0
  }
  return sumCraftingIngredientQuantities(recipe, (Number(event.TerritoryStanding) || 0) * scale)
}

export function calculateRecipeGearScore({
  item,
  ingredients,
  recipe,
  tradeskill,
}: {
  item: MasterItemDefinitions | HouseItems
  ingredients: Array<MasterItemDefinitions | HouseItems>
  recipe: CraftingRecipeData
  tradeskill: TradeskillRankData
}) {
  if (!item || !recipe || !recipe.BaseGearScore) {
    return null
  }
  const baseGs = recipe.BaseGearScore || 0
  const itemTier = item.Tier
  let skillBonusMin = tradeskill?.MinGearScoreBonus || 0
  let skillBonusMax = tradeskill?.MaxGearScoreBonus || 0
  if (tradeskill) {
    if (itemTier >= 2) {
      skillBonusMin = tradeskill.MinGearScoreBonusT2 ?? skillBonusMin
      skillBonusMax = tradeskill.MaxGearScoreBonusT2 ?? skillBonusMax
    }
    if (itemTier >= 3) {
      skillBonusMin = tradeskill.MinGearScoreBonusT3 ?? skillBonusMin
      skillBonusMax = tradeskill.MaxGearScoreBonusT3 ?? skillBonusMax
    }
    if (itemTier >= 4) {
      skillBonusMin = tradeskill.MinGearScoreBonusT4 ?? skillBonusMin
      skillBonusMax = tradeskill.MaxGearScoreBonusT4 ?? skillBonusMax
    }
    if (itemTier >= 5) {
      skillBonusMin = tradeskill.MinGearScoreBonusT5 ?? skillBonusMin
      skillBonusMax = tradeskill.MaxGearScoreBonusT5 ?? skillBonusMax
    }
  }

  const ingrMinBonuses = ingredients.map((it) => {
    return isMasterItem(it) ? Number(it.IngredientGearScoreBaseBonus) || 0 : 0
  })
  const ingrMaxBonuses = ingredients.map((it) => {
    return isMasterItem(it) ? Number(it.IngredientGearScoreMaxBonus) || 0 : 0
  })

  const result = {
    base: baseGs,
    bonusMin: 0,
    bonusMax: 0,
    override: isMasterItem(item) ? item.GearScoreOverride : 0,
    finalMin: 0,
    finalMax: 0,
    uncappedMin: 0,
    uncappedMax: 0,
    maxCraftGs: NW_MAX_CRAFT_GEAR_SCORE,
    bonuses: [] as Array<{ label: string; min: number; max: number; enabled: boolean }>,
  }
  if (isMasterItem(item) && item.MaxCraftGS) {
    result.maxCraftGs = item.MaxCraftGS
  }
  for (let i = 0; i < ingredients?.length; i++) {
    const ingredient = ingredients[i]
    result.bonuses.push({
      label: ingredient.Name,
      min: ingrMinBonuses[i],
      max: ingrMaxBonuses[i],
      enabled: !recipe.DisallowBonusesToGS,
    })
  }
  if (tradeskill) {
    result.bonuses.push({
      label: `Tradeskill lvl. ${tradeskill.Level}`,
      min: skillBonusMin,
      max: skillBonusMax,
      enabled: !recipe.DisallowBonusesToGS,
    })
  }
  for (const bonus of result.bonuses) {
    if (bonus.enabled) {
      result.bonusMin += bonus.min
      result.bonusMax += bonus.max
    }
  }

  result.finalMin = result.base + result.bonusMax
  result.finalMax = result.base + result.bonusMax
  result.uncappedMin = result.finalMin
  result.uncappedMax = result.finalMax
  if (result.maxCraftGs) {
    result.finalMin = Math.min(result.finalMin, result.maxCraftGs)
    result.finalMax = Math.min(result.finalMax, result.maxCraftGs)
  }
  if (result.override) {
    result.finalMin = result.override
    result.finalMax = result.override
    result.uncappedMin = result.finalMin
    result.uncappedMax = result.finalMax
  }
  return result
}

export function calculateBonusItemChance({
  item,
  ingredients,
  recipe,
  skillLevel,
  customChance,
  refiningChance,
}: {
  item: MasterItemDefinitions | HouseItems
  ingredients: Array<MasterItemDefinitions | HouseItems>
  recipe: CraftingRecipeData
  skillLevel?: number
  customChance?: number
  refiningChance?: number
}) {
  if (!item || !recipe?.IsRefining || recipe?.BonusItemChance == null || !ingredients?.length) {
    return 0
  }
  // only category ingrediens affect bonus chance
  ingredients = ingredients.filter((_, i) => recipe[`Type${i + 1}`] === 'Category_Only')
  skillLevel = skillLevel ?? NW_MAX_TRADESKILL_LEVEL

  // positive Tier difference lookup map
  const increments = (recipe.BonusItemChanceIncrease || '').split(',').map(Number)
  // negative Tier difference lookup map
  const decrements = (recipe.BonusItemChanceDecrease || '').split(',').map(Number)
  // seems to be a weird data bug in some recipes (Lumber) which leads
  // to results different from values in the game, if we do not remove
  // leading '0' entries
  while (decrements[0] === 0) {
    decrements.shift()
  }
  while (increments[0] === 0) {
    increments.shift()
  }

  const ingrTiers = ingredients.map((it) => it.Tier)
  const ingrDiffs = ingrTiers.map((it) => it - item.Tier)
  const ingrChances = ingrDiffs.map((diff) => {
    if (diff === 0) {
      return 0
    }
    return (diff < 0 ? decrements : increments)[Math.abs(diff) - 1] ?? 0
  })
  const baseChance = recipe.BonusItemChance
  const skillChance = skillLevel / 1000
  const ingrChance = ingrChances.reduce((a, b) => a + b, 0)
  refiningChance = (skillLevel ? refiningChance : 0) || 0

  const result = baseChance + skillChance + ingrChance + (customChance || 0) + refiningChance

  // console.table({
  //   ingrTiers: ingrTiers.map(String),
  //   ingrDiffs: ingrDiffs.map(String),
  //   increments: increments.map((it) => (it * 100).toFixed(0)),
  //   decrements: decrements.map((it) => (it * 100).toFixed(0)),
  //   skillChance: [(skillChance * 100).toFixed(0)],
  //   baseChance: [(baseChance * 100).toFixed(0)],
  //   ingrChance: [(ingrChance * 100).toFixed(0)],
  //   customChance: [(customChance * 100).toFixed(0)],
  //   refiningChance: [(refiningChance * 100).toFixed(0)],
  //   result: [(result * 100).toFixed(0)],
  // })

  return Math.max(0, result)
}

export function getTradeSkillLabel(value: string) {
  return value != null ? `ui_${value}` : null
}

export function getCraftingCategoryLabel(value: string) {
  if (!value) {
    return null
  }
  return NW_CRAFTING_CATEGORY_NAMES[value] || `${value}_groupname`
}

export function getCraftingGroupLabel(value: string) {
  if (!value) {
    return null
  }
  return NW_CRAFTING_GROUP_NAMES[value] || `${value}_groupname`
}
