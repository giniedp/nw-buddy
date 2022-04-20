import { Injectable } from '@angular/core'
import { Crafting, ItemDefinitionMaster } from '@nw-data/types'

import { GridOptions } from 'ag-grid-community'
import { Observable, take } from 'rxjs'
import { TranslateService } from '../i18n'
import { NwDbService } from './nw-db.service'
import { NwExpressionService } from './nw-expression'
import { NwItemMetaService } from './nw-item-meta.service'
import { nwdbLinkUrl } from './nwdbinfo'

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

  public itemRarity(item: ItemDefinitionMaster) {
    if (item.ForceRarity) {
      return item.ForceRarity
    }
    let rarity = 0
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
    return rarity
  }

  public itemTierRoman(item: ItemDefinitionMaster) {
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

    this.itemRarity(item)
  }

  public itemRarityKey(item: ItemDefinitionMaster) {
    return `RarityLevel${this.itemRarity(item)}_DisplayName`
  }

  public itemRarityName(item: ItemDefinitionMaster) {
    return this.translate(this.itemRarityKey(item))
  }

  public iconPath(path: string) {
    return this.db.data.iconPath(path)
  }
  public translate(key: string) {
    return this.translations.get(buildTranslateKey(key))
  }
  public findRecipeForItem(item: ItemDefinitionMaster, recipes: Crafting[]) {
    return recipes.find((it) => {
      if (it.CraftingCategory === 'MaterialConversion' || !it.OutputQty) {
        return false
      }
      if (it.IsProcedural) {
        return (
          item.Tier === it.BaseTier &&
          (it.ProceduralTierID1 === item.ItemID ||
            it.ProceduralTierID2 === item.ItemID ||
            it.ProceduralTierID3 === item.ItemID ||
            it.ProceduralTierID4 === item.ItemID ||
            it.ProceduralTierID5 === item.ItemID)
        )
      }
      return it.RecipeID === item.CraftingRecipe || it.ItemID === item.ItemID
      // if (item.CraftingRecipe) {

      // }
      // return false
    })
  }

  public calculateBonusItemChance(item: ItemDefinitionMaster, ingredient: ItemDefinitionMaster, recipe: Crafting) {
    if (!item || !ingredient || !recipe) {
      return 0
    }
    if (recipe.BonusItemChance == null) {
      return 0
    }
    const base = 0.2 // skill / 10
    const chance = recipe.BonusItemChance
    const diff = ingredient.Tier - item.Tier
    console.log(diff)
    if (diff >= 0) {
      return base + chance + recipe.BonusItemChanceIncrease.split(',').map(Number)[diff]
    } else if (diff < 0) {
      return base + chance +  recipe.BonusItemChanceDecrease.split(',').map(Number)[Math.abs(diff) - 1]
    }
    return base + chance
  }
}

function buildTranslateKey(key: string, options?: { prefix?: string; suffix?: string }) {
  if (key == null) {
    return key
  }
  key = String(key)
  if (options) {
    if (options.prefix) {
      key = options.prefix + key
    }
    if (options.suffix) {
      key = key + options.suffix
    }
  }
  if (key.startsWith('@')) {
    return key.substring(1)
  }
  return key
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
