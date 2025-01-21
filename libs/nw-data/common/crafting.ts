import {
  CraftingIngredientType,
  CraftingRecipeData,
  GameEventData,
  HouseItems,
  MasterItemDefinitions,
  TradeskillRankData,
} from '@nw-data/generated'
import { NW_MAX_CRAFT_GEAR_SCORE } from './constants'
import { getItemId, isMasterItem } from './item'
import { getTradeskillRankRollBonus } from './tradeskill'

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
    .map((key, i) => {
      return {
        ingredient: recipe[`Ingredient${i + 1}`] as string,
        quantity: recipe[`Qty${i + 1}`] as number,
        type: recipe[`Type${i + 1}`] as CraftingIngredientType ?? 'Item',
        ref: `${i}`,
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

export function canCraftWithLevel(recipe: CraftingRecipeData, tradeskillLevel: number) {
  if (!recipe) {
    return false
  }
  if (!recipe.Tradeskill || !recipe.RecipeLevel) {
    return true
  }
  return tradeskillLevel >= recipe.RecipeLevel
}

export function getCraftingGearScore({
  item,
  ingredients,
  recipe,
  tradeskill,
  buffs,
}: {
  item: MasterItemDefinitions | HouseItems
  ingredients: Array<MasterItemDefinitions | HouseItems>
  recipe: CraftingRecipeData
  tradeskill: TradeskillRankData
  buffs: number
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
      label: `${recipe.Tradeskill} lvl. ${tradeskill.Level}`,
      min: skillBonusMin,
      max: skillBonusMax,
      enabled: !recipe.DisallowBonusesToGS,
    })
  }
  if (buffs) {
    result.bonuses.push({
      label: `${recipe.Tradeskill} Buffs`,
      min: buffs,
      max: buffs,
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

export function isCraftedWithRefiningSkill(recipe: Pick<CraftingRecipeData, 'Tradeskill'>) {
  const skill = recipe?.Tradeskill
  return (
    skill === 'Woodworking' ||
    skill === 'Weaving' ||
    skill === 'Smelting' ||
    skill === 'Stonecutting' ||
    skill === 'Leatherworking'
  )
}

export function isCraftedWithFactionYieldBonus(recipe: CraftingRecipeData) {
  return isCraftedWithYieldBonus(recipe) && isCraftedWithRefiningSkill(recipe)
}

export function isCraftedWithYieldBonus(recipe: CraftingRecipeData) {
  return !!recipe && !!recipe.CraftAll && !recipe.SkipGrantItems && !!recipe.Tradeskill // && !recipe.BaseGearScore
}

export function getCraftingBonusForIngredients({
  item,
  ingredients,
  recipe,
}: {
  item: MasterItemDefinitions | HouseItems
  ingredients: Array<MasterItemDefinitions | HouseItems>
  recipe: CraftingRecipeData
}) {
  if (!item || !recipe) {
    return 0
  }
  if (!recipe.BonusItemChanceIncrease && !recipe.BonusItemChanceDecrease) {
    return 0
  }
  if (ingredients.length <= 1) {
    // HACK: fixes charcoal recipes (charcoalt1)
    return 0
  }

  ingredients = (ingredients || []).filter((_, i) => recipe[`Type${i + 1}`] === 'Category_Only')
  const increments = (recipe.BonusItemChanceIncrease || '').split(',').map(Number)
  const decrements = (String(recipe.BonusItemChanceDecrease) || '').split(',').map(Number)

  let recipeTier = recipe.BaseTier ?? item.Tier
  if (getItemId(item).toLowerCase() === 'blockt5') {
    // HACK: otherwise it has 5% more than ingame
    recipeTier = 4
  }
  if (
    getItemId(item)
      .toLowerCase()
      .match(/^alkahestt\d$/)
  ) {
    // HACK:
    recipeTier = 0
  }

  const ingredTier = ingredients.map((it) => it.Tier)
  const ingredDiffs = ingredTier.map((it) => it - recipeTier)
  const ingredChances = ingredDiffs.map((diff) => {
    if (diff < 0) {
      return decrements[Math.abs(diff) - 1] ?? 0
    }
    if (diff > 0) {
      return increments[diff - 1] ?? 0
    }
    return 0
  })
  // console.table({
  //   incr: recipe.BonusItemChanceIncrease,
  //   decr: recipe.BonusItemChanceDecrease,
  //   increments,
  //   decrements,
  //   ingredients: ingredients.map((it) => getItemId(it)),
  //   recipeT: recipeTier,
  //   ingrT: ingredTier,
  //   ingrDiffs: ingredDiffs,
  //   ingrChances: ingredChances,
  // })

  return ingredChances.reduce((a, b) => a + b, 0)
}

export interface CraftingYieldBonusInput {
  item: MasterItemDefinitions | HouseItems
  ingredients: Array<MasterItemDefinitions | HouseItems>
  recipe: CraftingRecipeData
  skill: Pick<TradeskillRankData, 'RollBonus'>
  buffs: number
  fortBuffs: number
}
export function getCraftingYieldBonusInfo({
  item,
  ingredients,
  recipe,
  skill,
  buffs,
  fortBuffs,
}: CraftingYieldBonusInput) {
  if (!recipe || !isCraftedWithYieldBonus(recipe)) {
    return null
  }

  const chanceBuffs = buffs
  const chanceSkill = getTradeskillRankRollBonus(skill)
  const chanceFort = isCraftedWithFactionYieldBonus(recipe) ? fortBuffs : 0
  const chanceBase = recipe.BonusItemChance || 0
  const chanceIngr = getCraftingBonusForIngredients({
    recipe,
    item,
    ingredients,
  })

  const result = Math.max(0, chanceBase + chanceIngr + chanceFort + chanceSkill + chanceBuffs)
  // console.table({
  //   recipe: recipe.RecipeID,
  //   chanceBase,
  //   chanceIngr,
  //   chanceSkill,
  //   chanceBuffs,
  //   chanceFort,
  //   result,
  // })
  return {
    base: chanceBase,
    ingredients: chanceIngr,
    skill: chanceSkill,
    buffs: chanceBuffs,
    fort: chanceFort,
    total: result,
  }
}

export function getCraftingYieldBonus(options: CraftingYieldBonusInput) {
  return getCraftingYieldBonusInfo(options)?.total || 0
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
