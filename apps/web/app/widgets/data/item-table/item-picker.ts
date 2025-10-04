import { Injector } from '@angular/core'
import {
  getItemRarityWeight,
  isItemArmor,
  isItemBag,
  isItemHeartGem,
  isItemJewelery,
  isItemOfAllClass,
  isItemOfAnyClass,
  isItemTool,
  isItemWeapon,
} from '@nw-data/common'
import { ItemClass } from '@nw-data/generated'
import { DataViewPicker } from '~/ui/data/data-view'
import { ItemTableAdapter, buildPickerItemGridOptions } from './item-table-adapter'
import { ItemTableRecord } from './item-table-cols'

export function openItemsPicker(options: {
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  categories?: ItemClass[]
  categories2?: ItemClass[]
  categoriesOp?: 'all' | 'any'
  noSkins?: boolean
}) {
  return DataViewPicker.from({
    injector: options.injector,
    title: options.title || 'Pick item',
    selection: options.selection,
    persistKey: `picker:items-grid:${options.categories?.join('-') || 'default'}`,
    dataView: {
      adapter: ItemTableAdapter,
      filter: itemFilter(options.categories, options.categories2, options.categoriesOp, options.noSkins),
      sort: (a, b) => {
        let result = b.Tier - a.Tier
        if (!result) {
          result = getItemRarityWeight(b) - getItemRarityWeight(a)
        }
        return result
      },
      gridOptions: (utils) => {
        return {
          ...buildPickerItemGridOptions(utils),
          rowSelection: options.multiple ? 'multiple' : 'single',
        }
      },
    },
  })
}
function doesMatchCategory(it: ItemTableRecord, categories: ItemClass[], categoriesOp: 'all' | 'any') {
  if (!categories?.length) {
    return true
  }

  categoriesOp ||= 'all'
  if (categoriesOp === 'all' && isItemOfAllClass(it, categories)) {
    return true
  }
  if (categoriesOp === 'any' && isItemOfAnyClass(it, categories)) {
    return true
  }
  return false
}

function itemFilter(categories: ItemClass[], categories2: ItemClass[], categoriesOp: 'all' | 'any', noSkins: boolean) {
  if (!categories?.length && !categories2?.length) {
    return () => true
  }

  return (it: ItemTableRecord) => {
    let doesMatch = false
    if (categories?.length && doesMatchCategory(it, categories, categoriesOp)) {
      doesMatch = true
    }
    if (categories2?.length && doesMatchCategory(it, categories2, categoriesOp)) {
      doesMatch = true
    }
    if (!doesMatch) {
      return false
    }
    if (!noSkins) {
      return true
    }
    if (isItemJewelery(it) || isItemHeartGem(it) || isItemBag(it)) {
      return true // can not have skins
    }
    if ((isItemArmor(it) || isItemWeapon(it) || isItemTool(it)) && (!it.CanHavePerks || !it.ItemStatsRef)) {
      return false
    }
    return true
  }
}
