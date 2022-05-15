import { Injectable } from '@angular/core'
import { Crafting, GameEvent, Housingitems, ItemDefinitionMaster, Perks } from '@nw-data/types'

import { GridOptions } from 'ag-grid-community'
import { TranslateService } from '../i18n'
import { ItemPreferencesService, RecipePreferencesService } from '../preferences'
import { NwDbService } from './nw-db.service'
import { NwExpressionService } from './nw-expression'
import { NwTradeskillService } from './nw-tradeskill.service'
import { nwdbLinkUrl } from './nwdbinfo'
import m from 'mithril'
import { LootbucketService } from './lootbucket.service'

@Injectable({ providedIn: 'root' })
export class NwService {
  public constructor(
    public readonly db: NwDbService,
    public readonly lootbuckets: LootbucketService,
    public readonly translations: TranslateService,
    public readonly expression: NwExpressionService,
    public readonly itemPref: ItemPreferencesService,
    public readonly recipePref: RecipePreferencesService,
    public readonly tradeskills: NwTradeskillService
  ) {}

  public moneyFormatter = Intl.NumberFormat(navigator.language, {
    minimumFractionDigits: 2
  })

  public gridOptions(options: GridOptions): GridOptions {
    return {
      rowHeight: 40,
      defaultColDef: {
        resizable: true,
        sortable: true,
        filter: true,
        ...(options.defaultColDef || {}),
      },
      ...options,
    }
  }

  public nwdbUrl = nwdbLinkUrl

  public itemRarity(item: ItemDefinitionMaster | Housingitems) {
    if (item.ForceRarity) {
      return item.ForceRarity
    }
    let rarity = 0
    if ('ItemID' in item) {
      if (item.Perk1 && !item.Perk1?.startsWith('PerkID_Stat_')) {
        rarity += 1
      }
      if (item.Perk2 && !item.Perk2?.startsWith('PerkID_Stat_')) {
        rarity += 1
      }
      if (item.Perk3 && !item.Perk3?.startsWith('PerkID_Stat_')) {
        rarity += 1
      }
      if (item.Perk4 && !item.Perk4?.startsWith('PerkID_Stat_')) {
        rarity += 1
      }
      if (item.Perk5 && !item.Perk5?.startsWith('PerkID_Stat_')) {
        rarity += 1
      }
    }
    return rarity
  }

  public tierToRoman(tier: number) {
    switch (tier) {
      case 0:
        return '-'
      case 1:
        return 'Ⅰ'
      case 2:
        return 'Ⅱ'
      case 3:
        return 'Ⅲ'
      case 4:
        return 'Ⅳ'
      case 5:
        return 'Ⅴ'
      default:
        return String(tier ?? '')
    }
  }

  public itemRarityKey(item: ItemDefinitionMaster | Housingitems) {
    return `RarityLevel${this.itemRarity(item)}_DisplayName`
  }

  public itemRarityName(item: ItemDefinitionMaster | Housingitems) {
    return this.translate(this.itemRarityKey(item))
  }

  public itemPerkIds(item: ItemDefinitionMaster) {
    return [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5].filter((it) => !!it)
  }

  public itemPerks(item: ItemDefinitionMaster, perks: Map<string, Perks>) {
    return this.itemPerkIds(item).map((it) => perks.get(it))
  }

  public itemPerkPerkBucketIds(item: ItemDefinitionMaster) {
    return [item.PerkBucket1, item.PerkBucket2, item.PerkBucket3, item.PerkBucket4, item.PerkBucket5].filter((it) => !!it)
  }

  public iconPath(path: string) {
    return this.db.data.iconPath(path)
  }
  public translate(key: string) {
    return this.translations.get(key)
  }

  public translate$(key: string) {
    return this.translations.observe(key)
  }

  public itemId(item: ItemDefinitionMaster | Housingitems) {
    if (!item) {
      return null
    }
    return 'ItemID' in item ? item?.ItemID : item?.HouseItemID
  }
  public itemIdFromRecipe(item: Crafting) {
    if (!item) {
      return null
    }
    if (item.ItemID) {
      return item.ItemID
    }
    if (item[`ProceduralTierID${item.BaseTier}`]) {
      return item[`ProceduralTierID${item.BaseTier}`]
    }
    return item && (item.ItemID || item.ProceduralTierID5 || item.ProceduralTierID4 || item.ProceduralTierID3 || item.ProceduralTierID2 || item.ProceduralTierID1)
  }

  public recipeForItem(item: ItemDefinitionMaster | Housingitems, recipes: Crafting[]) {
    const itemId = this.itemId(item)
    if (!itemId) {
      return null
    }
    return recipes.find((recipe) => {
      if (recipe.CraftingCategory === 'MaterialConversion' || !recipe.OutputQty) {
        return false
      }
      if (recipe.IsProcedural) {
        return recipe[`ProceduralTierID${recipe.BaseTier}`] === itemId
      }
      return recipe.RecipeID === item.CraftingRecipe || recipe.ItemID === itemId
    })
  }

  public recipeItemQuantitySum(recipe: Crafting) {
    return Object.keys(recipe)
      .filter((it) => it.match(/^Qty\d+$/))
      .map((key) => recipe[key] || 0)
      .reduce((a, b) => a + b, 0)
  }

  public recipeIngredients(recipe: Crafting) {
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

  public recipeProgressionReward(recipe: Crafting, event: GameEvent) {
    return this.recipeItemQuantitySum(recipe) * (event.CategoricalProgressionReward || 0)
  }

  public calculateBonusItemChance({
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
    const skillChance = (skill ?? 200) / 1000
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
}

export interface IconComponentAttrs {
  src: string
  class: string
}
export const IconComponent: m.ClosureComponent<IconComponentAttrs> = () => {
  let hasError = false
  let didLoad = false
  function onError() {
    hasError = true
  }
  function onSuccess() {
    didLoad = true
  }
  return {
    view: ({ attrs }) => {
      return m('picture', {
        class: attrs.class,
      }, [
        m('img.fade', {
          src: attrs.src,
          class: [hasError ? 'error' : didLoad ? 'show' : ''].join(' '),
          onerror: onError,
          onload: onSuccess,
        })
      ])
    }
  }
}
