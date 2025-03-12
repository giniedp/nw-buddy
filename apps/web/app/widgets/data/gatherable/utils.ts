import { GatherableRecord, GatherableVariationRecord } from './gatherable.service'

export function getVariantColor(gatherable: GatherableRecord, variation: GatherableVariationRecord) {
  if (!gatherable || !variation) {
    return null
  }
  if (!gatherable.GatherableID.toLowerCase().includes('loot')) {
    return null
  }
}
