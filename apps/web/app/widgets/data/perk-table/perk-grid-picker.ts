import { Injector, runInInjectionContext } from '@angular/core'
import {
  getItemPerkIds,
  getItemPerkSlots,
  getPerkBucketPerkIDs,
  isItemArmor,
  isItemArtifact,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkEmptyGemSlot,
  isPerkExcludedFromItem,
  isPerkGem,
  isPerkInherent,
} from '@nw-data/common'
import { MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { isEqual } from 'lodash'
import { combineLatest, filter, from, map, Observable, switchMap } from 'rxjs'
import { injectNwData, ItemInstance } from '~/data'
import { DataViewPicker } from '~/ui/data/data-view'
import { eqCaseInsensitive } from '~/utils'
import { PerkTableAdapter } from './perk-table-adapter'
import { PerkTableRecord } from './perk-table-cols'

export function pickPerkForItem({
  injector,
  record,
  slotKey,
  filter: perkFilter,
}: {
  injector: Injector
  record: ItemInstance
  slotKey: string
  filter?: (perk: PerkTableRecord) => boolean
}): Observable<PerkData> {
  const db = runInInjectionContext(injector, () => injectNwData())
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
          item,
          injector,
          exclusiveLabels,
          selectedPerkid: selection,
          slotKey,
          filter: perkFilter,
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
  item: MasterItemDefinitions
  injector: Injector
  selectedPerkid: string
  slotKey: string
  exclusiveLabels: string[]
  filter?: (perk: PerkTableRecord) => boolean
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
        filter: options.filter,
      },
    }),
  )
}

function getAplicablePerksSource({
  injector,
  item,
  slotKey,
  exclusiveLabels,
}: {
  injector: Injector
  item: MasterItemDefinitions
  slotKey: string
  exclusiveLabels: string[]
}) {
  const db = runInInjectionContext(injector, () => injectNwData())
  return combineLatest({
    perks: db.perksAll(),
    perksMap: db.perksByIdMap(),
    bucketsMap: db.perkBucketsByIdMap(),
  }).pipe(
    map(({ perks, perksMap, bucketsMap }) => {
      const perk = perksMap.get(item[slotKey])

      const bucketId = item[slotKey]
      const bucket = bucketsMap.get(bucketId)

      const bucketPerkIds = getPerkBucketPerkIDs(bucket)
      const hasGemSlot = getItemPerkIds(item).some((it) => isPerkGem(perksMap.get(it)))

      const isWeapon = isItemWeapon(item)
      const isArmor = isItemArmor(item)

      const isArtifact = isItemArtifact(item)
      const emptyGemslotPerk = perks.find(isPerkEmptyGemSlot)
      const canHaveGemslot = isPerkApplicableToItem(emptyGemslotPerk, item)

      function isPerkAplicable(it: PerkData) {
        if (isPerkExcludedFromItem(it, item, !hasGemSlot)) {
          return false
        }
        if (canHaveGemslot && isPerkGem(it)) {
          return true
        }

        let isApplicable = isPerkApplicableToItem(it, item)
        if (isArmor && !isApplicable) {
          isApplicable = isItemArmor(it)
        }
        if (isWeapon && !isApplicable) {
          isApplicable = isItemWeapon(it)
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
        if (bucket) {
          return bucket.PerkType === it.PerkType
        }
        if (perk) {
          return perk.PerkType === it.PerkType
        }

        return false
      }

      return perks
        //.filter(isPerkAplicable)
        .map((perk): PerkTableRecord => {
        return {
          ...perk,
          $notAplicable: !isPerkAplicable(perk),
          $excludeError: exclusiveLabels.filter((label) => {
            return perk.ExclusiveLabels?.some((it) => eqCaseInsensitive(it, label))
          }),
        }
      })
    }),
  )
}
