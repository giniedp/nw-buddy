import { getItemPerkSlots, isItemOfAnyClass } from '@nw-data/common'
import { ItemClass, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { PoolItem, TranslateFn } from './types'

export function selectItemPool(options: {
  items: MasterItemDefinitions[]
  itemClass: ItemClass[]
  perksMap: Map<string, PerkData>
  tl8: TranslateFn
}): PoolItem[] {
  const result: PoolItem[] = []
  for (const item of options.items) {
    if (!isItemOfAnyClass(item, options.itemClass)) {
      continue
    }
    result.push({
      item: item,
      name: options.tl8(item.Name),
      slots: getItemPerkSlots(item),
    })
  }
  return result
}
