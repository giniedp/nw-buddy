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
      sort: itemComparator,
      gridOptions: (utils) => {
        return {
          ...buildPickerItemGridOptions(utils),
          rowSelection: options.multiple ? 'multiple' : 'single',
        }
      },
    },
  })
}

function itemComparator(a: ItemTableRecord, b: ItemTableRecord) {
  const aIsSlots = a.ItemID.includes('_Slots')
  const bIsSlots = b.ItemID.includes('_Slots')
  if (aIsSlots && bIsSlots) {
    return a.ItemID.localeCompare(b.ItemID)
  }
  if (aIsSlots) {
    return -1
  }
  if (bIsSlots) {
    return 1
  }

  const aRarity = getItemRarityWeight(a)
  const bRarity = getItemRarityWeight(b)
  if (aRarity !== bRarity) {
    return bRarity - aRarity
  }
  const aTier = a.Tier
  const bTier = b.Tier
  if (aTier !== bTier) {
    return bTier - aTier
  }
  const aName = a.Name || ''
  const bName = b.Name || ''
  return aName.localeCompare(bName)
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
