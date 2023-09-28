import { Dialog } from '@angular/cdk/dialog'
import { Injector } from '@angular/core'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { eqCaseInsensitive } from '~/utils'
import { ItemTableAdapter, buildPickerItemGridOptions } from './item-table-adapter'
import { ItemTableRecord } from './item-table-cols'
import { getItemRarity, getItemRarityWeight, isItemArmor, isItemWeapon } from '@nw-data/common'

export function openItemsPicker(options: {
  db: NwDbService
  dialog: Dialog
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  category?: string
  noSkins?: boolean
}) {
  return DataViewPicker.open(options.dialog, {
    title: options.title || 'Pick item',
    selection: options.selection,
    persistKey: `picker:items-grid:${options.category || 'default'}`,
    dataView: {
      adapter: ItemTableAdapter,
      filter: itemFilter(options.category, options.noSkins),
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
    config: {
      maxWidth: 1400,
      maxHeight: 1200,
      panelClass: ['w-full', 'h-full', 'p-4'],
      injector: options.injector,
    },
  })
}

function itemFilter(category: string, noSkins: boolean) {
  if (!category && !noSkins) {
    return () => true
  }

  return (it: ItemTableRecord) => {
    if (!it.ItemClass?.some((cls) => eqCaseInsensitive(cls, category))) {
      return false
    }
    if (noSkins && (it.ItemType === 'Armor' || it.ItemType === 'Weapons') && (!it.CanHavePerks || !it.ItemStatsRef)) {
      return false
    }
    return true
  }
}
