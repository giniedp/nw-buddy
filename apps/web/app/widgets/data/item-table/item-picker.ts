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
      filter: itemFilter(options.categories, options.categoriesOp, options.noSkins),
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

function itemFilter(categories: ItemClass[], categoriesOp: 'all' | 'any', noSkins: boolean) {
  categoriesOp ||= 'all'
  if (!categories?.length) {
    return () => true
  }

  return (it: ItemTableRecord) => {
    if (categoriesOp === 'all' && !isItemOfAllClass(it, categories)) {
      return false
    }
    if (categoriesOp === 'any' && !isItemOfAnyClass(it, categories)) {
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
