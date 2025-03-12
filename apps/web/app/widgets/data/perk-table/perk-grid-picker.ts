import {
  getItemPerkIds,
  getItemPerkSlots,
  getPerkBucketPerkIDs,
  isItemArmor,
  isItemArtifact,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkExcludedFromItem,
  isPerkGem,
  isPerkInherent,
} from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { isEqual } from 'lodash'
import { Observable, combineLatest, filter, from, map, switchMap } from 'rxjs'
import { ItemInstance } from '~/data'
import { DataViewPicker } from '~/ui/data/data-view'
import { eqCaseInsensitive } from '~/utils'
import { PerkTableAdapter } from './perk-table-adapter'
import { Injector } from '@angular/core'

export function pickPerkForItem({
  db,
  injector,
  record,
  slotKey,
  craftOnly,
}: {
  db: NwData
  injector: Injector
  record: ItemInstance
  slotKey: string
  craftOnly: boolean
}): Observable<PerkData> {
  return combineLatest({
    item: db.itemsById(record.itemId),
    perks: db.perksByIdMap(),
  }).pipe(
    switchMap(({ item, perks }) => {
      const selection = record.perks?.[slotKey]
      const exclusiveLabels: string[] = []
      for (const slot of getItemPerkSlots(item)) {
        const key = slot.bucketKey || slot.perkKey
        if (key === slotKey) {
          continue
        }
        const perkId = record.perks?.[key] || item[key]
        const perk = perks.get(perkId)
        exclusiveLabels.push(...(perk?.ExclusiveLabels || []))
      }

      return (
        openPerksPicker({
          db,
          item,
          injector,
          exclusiveLabels,
          selectedPerkid: selection,
          slotKey,
          craftOnly,
        })
          // cancelled selection
          .pipe(filter((it) => it !== undefined))
          // unchanged selection
          .pipe(filter((it) => !isEqual(it, [selection])))
          .pipe(map((it) => it?.[0]))
          .pipe(map((it: string) => perks.get(it) || null))
      )
    }),
  )
}

export function openPerksPicker(options: {
  db: NwData
  item: MasterItemDefinitions
  injector: Injector
  selectedPerkid: string
  slotKey: string
  exclusiveLabels: string[]
  craftOnly: boolean
}) {
  return from(
    DataViewPicker.open({
      injector: options.injector,
      title: 'Choose Perk',
      selection: options.selectedPerkid ? [options.selectedPerkid.toLowerCase()] : null,
      displayMode: ['grid'],
      dataView: {
        adapter: PerkTableAdapter,
        source: getAplicablePerksSource(options),
        filter: !options.craftOnly ? null : (it) => !!it.$items?.length,
      },
    }),
  )
}

function getAplicablePerksSource({
  db,
  item,
  slotKey,
  exclusiveLabels,
}: {
  db: NwData
  item: MasterItemDefinitions
  slotKey: string
  exclusiveLabels: string[]
}) {
  return combineLatest({
    perks: db.perksAll(),
    perksMap: db.perksByIdMap(),
    bucketsMap: db.perkBucketsByIdMap(),
  }).pipe(
    map(({ perks, perksMap, bucketsMap }) => {
      const perk = perksMap.get(item[slotKey])
      const perkIsGem = isPerkGem(perk)

      const bucketId = item[slotKey]
      const bucket = bucketsMap.get(bucketId)

      const bucketIsGem = isPerkGem(bucket)
      const bucketPerkIds = getPerkBucketPerkIDs(bucket)
      // const bucketPerks = bucketPerkIds.map((id) => perksMap.get(id))
      const hasGemSlot = getItemPerkIds(item).some((it) => isPerkGem(perksMap.get(it)))

      const isWeapon = isItemWeapon(item)
      const isArmor = isItemArmor(item)
      // const isJewelery = isItemJewelery(item)
      const isArtifact = isItemArtifact(item)

      return perks
        .filter((it) => {
          if (isPerkExcludedFromItem(it, item, !hasGemSlot)) {
            return false
          }

          let isApplicable = isPerkApplicableToItem(it, item)
          if (isArmor && !isApplicable) {
            isApplicable = it.ItemClass?.includes('Armor')
          }
          if (isWeapon && !isApplicable) {
            isApplicable = it.ItemClass?.includes('EquippableMainHand') || it.ItemClass?.includes('EquippableTwoHand')
          }
          if (!isApplicable) {
            return false
          }
          if (isArtifact && !hasGemSlot) {
            // artifacts only have one custom perk slot
            // user may choose either gem or perk (no attribute however)
            return isApplicable && !isPerkInherent(it)
          }

          if (bucketPerkIds.includes(it.PerkID)) {
            // always allow whatever is in the bucket
            return true
          }
          if (bucketIsGem) {
            return bucket.PerkType === it.PerkType
          }
          if (perkIsGem) {
            return perk.PerkType === it.PerkType
          }
          if (bucket) {
            return bucket.PerkType === it.PerkType
          }
          if (perk) {
            return perk.PerkType === it.PerkType
          }

          return false
        })
        .map((perk) => {
          return {
            ...perk,
            $excludeError: exclusiveLabels.filter((label) => {
              return perk.ExclusiveLabels?.some((it) => eqCaseInsensitive(it, label))
            }),
          }
        })
    }),
  )
}
