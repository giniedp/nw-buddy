import { Injectable } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'

import { GridOptions } from 'ag-grid-community'
import { Observable, take } from 'rxjs'
import { TranslateService } from '../i18n'
import { NwDbService } from './nw-db.service'
import { NwExpressionService } from './nw-expression'
import { NwItemMetaService } from './nw-item-meta.service'
import { nwdbLinkUrl } from './nwdbinfo'

const CATEGORIES_GRANTING_BONUS = [
  'Concoctions',
  'ArcanaRefining',
  'Consumables',
  'Dyes',
  'Foods',
  'BasicCooking',
  'Consumables',
  'Cutstone',
  'RefinedResources'
]

@Injectable({ providedIn: 'root' })
export class NwService {
  public constructor(
    public readonly meta: NwItemMetaService,
    public readonly db: NwDbService,
    public readonly translations: TranslateService,
    public readonly expression: NwExpressionService
  ) {}

  public gridOptions(options: GridOptions): GridOptions {
    return {
      rowHeight: 40,
      defaultColDef: {
        sortable: true,
        filter: true,
        // floatingFilter: true,
        ...(options.defaultColDef || {}),
      },
      ...options,
    }
  }

  public cellRendererIcon = <T>(key: keyof T, options?: { size?: number; rarity?: (item: T) => number }) => {
    return (params: { data: T }) => {
      return this.renderIcon(params.data[key] as any, {
        size: options.size,
        rarity: options?.rarity?.(params.data),
      })
    }
  }

  public cellRendererAsync = <T>(valueFn: (data: T) => Observable<string>) => {
    return (params: { data: T }) => {
      const el = document.createElement('span')
      valueFn(params.data)
        .pipe(take(1)) // TODO:
        .subscribe((value) => {
          el.innerText = value
        })
      return el
    }
  }

  public nwdbLinkUrl = nwdbLinkUrl

  public renderIcon(path: string, options?: { size?: number; rarity?: number }) {
    const iconPath = this.iconPath(path as string)
    const rarity = options?.rarity
    return createIconHtml(iconPath, {
      size: options?.size,
      class: rarity ? `bg-rarity-${rarity}` : null,
    })
  }

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

  public itemTierRoman(item: ItemDefinitionMaster | Housingitems) {
    switch (item.Tier) {
      case 0:
        return '-'
      case 1:
        return 'I'
      case 2:
        return 'II'
      case 3:
        return 'III'
      case 4:
        return 'IV'
      case 5:
        return 'V'
      default:
        return String(item.Tier)
    }
  }

  public itemRarityKey(item: ItemDefinitionMaster | Housingitems) {
    return `RarityLevel${this.itemRarity(item)}_DisplayName`
  }

  public itemRarityName(item: ItemDefinitionMaster | Housingitems) {
    return this.translate(this.itemRarityKey(item))
  }

  public iconPath(path: string) {
    return this.db.data.iconPath(path)
  }
  public translate(key: string) {
    if (typeof key === 'string' && key.startsWith('@')) {
      key = key.substring(1)
    }
    return this.translations.get(key)
  }

  public itemIdFromRecipe(item: Crafting) {
    return item && (item.ItemID || item.ProceduralTierID5 || item.ProceduralTierID4 || item.ProceduralTierID3 || item.ProceduralTierID2 || item.ProceduralTierID1)
  }

  public findRecipeForItem(item: ItemDefinitionMaster | Housingitems, recipes: Crafting[]) {
    if (!item) {
      return null
    }
    return recipes.find((it) => {
      if (it.CraftingCategory === 'MaterialConversion' || !it.OutputQty) {
        return false
      }
      const id = 'ItemID' in item ? item.ItemID : item.HouseItemID
      if (it.IsProcedural) {
        return (
          item.Tier === it.BaseTier &&
          (it.ProceduralTierID1 === id ||
            it.ProceduralTierID2 === id ||
            it.ProceduralTierID3 === id ||
            it.ProceduralTierID4 === id ||
            it.ProceduralTierID5 === id)
        )
      }
      return it.RecipeID === item.CraftingRecipe || it.ItemID === id
    })
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
    if (!CATEGORIES_GRANTING_BONUS.includes(recipe.CraftingCategory)) {
      return 0
    }
    const base = (skill ?? 200) / 1000 + recipe.BonusItemChance
    const chances = ingredients
      // .filter((it) => {
      //   return (
      //     it.TradingGroup === 'RefiningComponents' ||
      //     it.TradingGroup === 'AlchemyMedicinal' ||
      //     it.TradingGroup === 'AlchemyProtective'
      //   )
      // })
      .map((it) => {
        const diff = it.Tier - item.Tier
        if (!diff) {
          return 0
        }
        const lookup = (diff < 0 ? recipe.BonusItemChanceDecrease : recipe.BonusItemChanceIncrease) || ''
        const values = lookup.split(',').map(Number)
        while (values.length && !values[0]) {
          values.shift()
        }
        return values[Math.abs(diff) - 1] || 0
      })
    let result = base
    for (const value of chances) {
      result += value
    }
    return Math.max(0, result)
  }
}

function createIconHtml(path: string, options: { size: number; class: string }) {
  const size = options?.size ?? 36
  const cclass = ['nw-icon', 'fade', options?.class].filter((it) => !!it).join(' ')
  return `
    <picture class="${cclass}" style="width: ${size}px; height: ${size}px">
      <img src="${path}" onerror="this.parentElement.classList.add('error')" onload="this.parentElement.classList.add('show')"/>
    </picture>
  `
}
