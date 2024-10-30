import { Injector } from '@angular/core'
import { getItemRarityWeight, isItemHeartGem, isItemJewelery } from '@nw-data/common'
import { DataViewPicker } from '~/ui/data/data-view'
import { eqCaseInsensitive } from '~/utils'
import { ItemTableAdapter, buildPickerItemGridOptions } from './item-table-adapter'
import { ItemTableRecord } from './item-table-cols'

export function openItemsPicker(options: {
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  categories?: string[]
  noSkins?: boolean
}) {
  return DataViewPicker.from({
    injector: options.injector,
    title: options.title || 'Pick item',
    selection: options.selection,
    persistKey: `picker:items-grid:${options.categories?.join('-') || 'default'}`,
    dataView: {
      adapter: ItemTableAdapter,
      filter: itemFilter(options.categories, options.noSkins),
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

function itemFilter(categories: string[], noSkins: boolean) {
  if (!categories?.length) {
    return () => true
  }

  return (it: ItemTableRecord) => {
    if (!it.ItemClass?.some((cls) => categories.some((it) => eqCaseInsensitive(cls, it)))) {
      return false
    }
    if (!noSkins) {
      return true
    }
    if (isItemJewelery(it) || isItemHeartGem(it)) {
      return true // can not have skins
    }
    if ((it.ItemType === 'Armor' || it.ItemType === 'Weapon') && (!it.CanHavePerks || !it.ItemStatsRef)) {
      return false
    }
    return true
  }
}
