import { getItemPerkSlots, isItemOfAnyClass } from '@nw-data/common'
import { ItemClass, ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { PoolItem, TranslateFn } from './types'

export function selectItemPool(options: {
  items: ItemDefinitionMaster[]
  itemClass: ItemClass[]
  perksMap: Map<string, Perks>
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
