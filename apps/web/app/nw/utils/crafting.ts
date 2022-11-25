import { Crafting, GameEvent, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { NW_MAX_TRADESKILL_LEVEL } from './constants'

export type CraftingIngredients = Pick<
  Crafting,
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

const NW_CRAFTING_GROUP_NAMES= {

  Alkahest:'CategoryData_Alkahest',
  LargeFurnishings:'CategoryData_LargeFurnishings',
  SmallFurnishings:'CategoryData_SmallFurnishings',
  MeleeWeapons:'CategoryData_MeleeWeapons',
  RangedWeapons:'CategoryData_RangedWeapons',
  Trophies:'CategoryData_Trophies',
  Potion:'CategoryData_Potion',
  Metal:'Metal_CategoryName',
  MetalPrecious:'MetalPrecious_CategoryName',
  AttributeDex: 'AttributeDex',
  AttributeCon: 'AttributeCon',
  AttributeFoc: 'AttributeFoc',
  AttributeInt: 'AttributeInt',
  AttributeStr: 'AttributeStr',
  SalvageCreate:'SalvageCreate',
  SalvageResearch:'SalvageResearch',
  SalvageExtract: 'SalvageExtract',
  PatternRecipes: 'PatternRecipes',
  Keys: 'KeyParts_groupname',

}
const NW_CRAFTING_CATEGORY_NAMES= {
  TimelessShardsCon: 'TimelessShardsCon',
  TimelessShardsDex: 'TimelessShardsDex',
  TimelessShardsFoc: 'TimelessShardsFoc',
  TimelessShardsInt: 'TimelessShardsInt',
  TimelessShardsStr: 'TimelessShardsStr',
  Salvage: 'Salvage',
  SalvageCreate: 'SalvageCreate',
  Pattern: 'Pattern',
  Keys: 'KeyParts_groupname',
  CorruptedRefining:'CorruptedRefinement_GroupName',
  Bags: 'CategoryData_Bags',
  Tools:'inv_tools',
  Dyes: 'CategoryData_Dyes'
}
const CRAFTING_CATEGORY_GRANTING_BONUS = [
  'ArcanaRefining',
  'BasicCooking',
  'Concoctions',
  'CorruptedRefining',
  'CutGems',
  'CutStone',
  'Dyes',
  'Foods',
  'FuseGems',
  'RefinedResources'

]

export function sumIngredientQuantities(recipe: CraftingIngredients) {
  return Object.keys(recipe)
    .filter((it) => it.match(/^Qty\d+$/))
    .map((key) => recipe[key] || 0)
    .reduce((a, b) => a + b, 0)
}

export function getIngretientsFromRecipe(recipe: CraftingIngredients) {
  return Object.keys(recipe || {})
    .filter((it) => it.match(/^Ingredient\d+$/))
    .map((_, i) => {
      return {
        ingredient: recipe[`Ingredient${i + 1}`],
        quantity: recipe[`Qty${i + 1}`],
        type: recipe[`Type${i + 1}`],
      }
    })
}

export function calculateCraftingReward(recipe: CraftingIngredients, event: GameEvent) {
  return sumIngredientQuantities(recipe) * (event.CategoricalProgressionReward || 0)
}

export function calculateBonusItemChance({
  item,
  ingredients,
  recipe,
  skill,
}: {
  item: ItemDefinitionMaster | Housingitems
  ingredients: Array<ItemDefinitionMaster | Housingitems>
  recipe: Crafting
  skill?: number
}) {
  if (!item || recipe?.BonusItemChance == null || !ingredients?.length) {
    return 0
  }
  if (!CRAFTING_CATEGORY_GRANTING_BONUS.includes(recipe.CraftingCategory)) {
    // this seems to work for all items except
    // 'CorruptedRefining'
    // TODO:
    return 0
  }
  // only category ingrediens affect bonus chance
  ingredients = ingredients.filter((_, i) => recipe[`Type${i + 1}`] === 'Category_Only')

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
  const skillChance = (skill ?? NW_MAX_TRADESKILL_LEVEL) / 1000
  const ingrChance = ingrChances.reduce((a, b) => a + b, 0)

  let result = baseChance + skillChance + ingrChance

  // console.table({
  //   ingrTiers: ingrTiers.map(String),
  //   ingrDiffs: ingrDiffs.map(String),
  //   increments: increments.map((it) => (it * 100).toFixed(0)),
  //   decrements: decrements.map((it) => (it * 100).toFixed(0)),
  //   skillChance: [(skillChance * 100).toFixed(0)],
  //   baseChance: [(baseChance * 100).toFixed(0)],
  //   ingrChance: [(ingrChance * 100).toFixed(0)],
  //   result: [(result * 100).toFixed(0)],
  // })

  return Math.max(0, result)
}

export function getTradeSkillLabel(value: string){
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
