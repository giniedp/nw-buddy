import { Backstorydata, Housingitems, ItemDefinitionMaster } from '../generated/types'

export interface BackstoryItemInstance {
  itemId: string
  quantity: number
  gearScore?: number
  perks?: string[]
}

export function getBackstoryInventoryItems(record: Backstorydata) {
  const result: BackstoryItemInstance[] = []
  for (const token of record.InventoryItem || []) {
    const [itemStr, quantityStr] = token.split(':')
    const itemInstance: BackstoryItemInstance = {
      itemId: null,
      quantity: Number(quantityStr) || 1,
    }
    itemStr.split('-').forEach((it, index) => {
      if (index === 0) {
        itemInstance.itemId = it
      } else if (it.match(/^\d+$/) && !itemInstance.gearScore) {
        itemInstance.gearScore = Number(it)
      } else {
        itemInstance.perks = itemInstance.perks || []
        itemInstance.perks.push(it)
      }
    })
    result.push(itemInstance)
  }
  return result
}
