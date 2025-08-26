import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  BucketEntry,
  getExclusiveLabelIntersection,
  getItemPerkIds,
  getItemPerkSlots,
  isPerkApplicableToItem,
  isPerkEntry,
  isPerkExcludedFromItem,
  PerkBucket,
  PerkBucketEntry,
} from '@nw-data/common'
import { MasterItemDefinitions, PerkData, PerkExclusiveLabelData } from '@nw-data/generated'
import { groupBy, sumBy } from 'lodash'
import { combineLatest, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'

export interface PerkBucketItemState {
  item: MasterItemDefinitions
  perkMap: Map<string, PerkData>
  perkBucketMap: Map<string, PerkBucket>
  labelMap: Map<string, PerkExclusiveLabelData>
  lockedPerkIds: Record<string, string>
}

export interface PerkBucketChanceRow {
  chance: number
  perkId: string
  perk: PerkData
  isRolled: boolean
  canRoll: boolean
}

export interface PerkBucketTab {
  key: string
  lockedPerkId: string
  bucket: PerkBucket
  rows: PerkBucketChanceRow[]
}

export const PerkBucketItemStore = signalStore(
  withState<PerkBucketItemState>({
    item: null,
    perkMap: new Map(),
    labelMap: new Map(),
    perkBucketMap: new Map(),
    lockedPerkIds: {},
  }),
  withMethods((state) => {
    const db = injectNwData()
    return {
      connectItemId: rxMethod<string>((input) => {
        return input.pipe(
          switchMap((itemId) => {
            return combineLatest({
              item: db.itemsById(itemId),
              perkMap: db.perksByIdMap(),
              labelMap: db.perksExclusiveLabelByIdMap(),
              perkBucketMap: db.perkBucketsByIdMap(),
            })
          }),
          map(({ item, perkBucketMap, perkMap, labelMap }) => {
            patchState(state, {
              item,
              perkMap,
              labelMap,
              perkBucketMap,
            })
          }),
        )
      }),
    }
  }),
  withMethods((state) => {
    return {
      setRolledPerk(bucketKey: string, perkId: string) {
        patchState(state, ({ lockedPerkIds }) => {
          return {
            lockedPerkIds: {
              ...lockedPerkIds,
              [bucketKey]: perkId,
            },
          }
        })
      },
    }
  }),
  withComputed(({ item, perkMap, lockedPerkIds }) => {
    const itemPerkSlots = computed(() => getItemPerkSlots(item()))
    return {
      itemPerks: computed(() => getItemPerkIds(item()).map((it) => perkMap().get(it))),
      rolledPerks: computed(() => {
        const result: Record<string, PerkData> = {}
        for (const slot of itemPerkSlots()) {
          if (slot.bucketKey) {
            const perkId = lockedPerkIds()[slot.bucketKey]
            result[slot.bucketKey] = perkMap().get(perkId)
          }
        }
        return result
      }),
    }
  }),
  withComputed(({ item, perkMap, perkBucketMap, labelMap, itemPerks, rolledPerks }) => {
    const buckets = computed(() => {
      const result: Record<string, PerkBucket> = {}
      for (const slot of getItemPerkSlots(item())) {
        const bucket = perkBucketMap().get(slot.bucketId)
        if (!bucket) {
          continue
        }
        result[slot.bucketKey] = reducePerkBucket({
          bucket,
          item: item(),
          perks: perkMap(),
          labels: labelMap(),
          itemPerks: itemPerks(),
        })
      }
      return result
    })

    const existingPerks = computed(() => {
      return [...itemPerks(), ...Object.values(rolledPerks())]
    })

    const bucketTabs = computed(() => {
      const result: PerkBucketTab[] = []
      for (const [key, bucket] of Object.entries(buckets())) {
        const rolledPerk = rolledPerks()[key]

        preprocessEntries({
          entries: bucket.Entries,
          ignoreLabels: bucket.IgnoreExclusiveLabelWeights,
          labels: labelMap(),
          perks: perkMap(),
          rolledPerk,
          rolledPerks: existingPerks(),
        })

        // console.log('---', bucket.PerkBucketID, '---')
        // dumpEntries(bucket.Entries)

        let rows = collectChanceRows({
          chance: bucket.PerkChance,
          perks: perkMap(),
          entries: bucket.Entries,
          rolledPerk,
        })
        rows = collapseChanceRows(rows)
        rows = rows.sort((a, b) => b.chance - a.chance)
        result.push({
          key,
          bucket,
          lockedPerkId: rolledPerk?.PerkID,
          rows,
        })
      }
      return result
    })

    return {
      bucketTabs,
    }
  }),
)

function reducePerkBucket<T extends PerkBucket | BucketEntry>({
  bucket,
  perks,
  labels,
  item,
  itemPerks,
}: {
  bucket: T
  perks: Map<string, PerkData>
  labels: Map<string, PerkExclusiveLabelData>
  item: MasterItemDefinitions
  itemPerks: PerkData[]
}): T {
  const result = { ...bucket }
  result.Entries = reducePerkEntries({
    entries: bucket.Entries,
    perks,
    labels,
    item,
    itemPerks,
  })
  return result
}

function reducePerkEntries({
  entries,
  perks,
  labels,
  item,
  itemPerks,
}: {
  entries: Array<PerkBucketEntry>
  perks: Map<string, PerkData>
  labels: Map<string, PerkExclusiveLabelData>
  item: MasterItemDefinitions
  itemPerks: PerkData[]
}) {
  if (!entries?.length) {
    return []
  }
  const result: PerkBucketEntry[] = []
  for (const entry of entries) {
    if (isPerkEntry(entry)) {
      const perk = perks.get(entry.PerkID)

      if (item && !isPerkApplicableToItem(perk, item)) {
        continue
      }
      if (item && isPerkExcludedFromItem(perk, item, true)) {
        continue
      }
      if (!canPerkRoll(perk, itemPerks)) {
        continue
      }

      result.push(entry)
    } else {
      const bucket = reducePerkBucket({
        bucket: entry,
        perks,
        labels,
        item,
        itemPerks: itemPerks,
      })
      if (bucket.Entries.length) {
        result.push(bucket)
      }
    }
  }
  return result
}

function preprocessEntries({
  entries,
  perks,
  rolledPerk,
  rolledPerks,
  labels,
  ignoreLabels,
}: {
  entries: EntryWithMeta[]
  perks: Map<string, PerkData>
  rolledPerk: PerkData
  rolledPerks: PerkData[]
  labels: Map<string, PerkExclusiveLabelData>
  ignoreLabels: boolean
}) {
  for (const entry of entries) {
    if (!isPerkEntry(entry)) {
      preprocessEntries({
        entries: entry.Entries,
        perks,
        rolledPerk,
        rolledPerks,
        labels,
        ignoreLabels,
      })
    }
  }
  for (const entry of entries) {
    if (!isPerkEntry(entry)) {
      entry.canRoll = entry.Entries.some((it: EntryWithMeta) => it.canRoll)
    } else {
      const perk = perks.get(entry.PerkID)
      entry.canRoll = canPerkRoll(perk, rolledPerks) && !rolledPerk
    }
    entry.labelWeight = getLabelWeight(entry, perks, labels, ignoreLabels)
    entry.finalWeight = entry.Weight * entry.labelWeight
  }
}

type EntryWithMeta = PerkBucketEntry & {
  canRoll?: boolean
  labelWeight?: number
  finalWeight?: number
}

export interface CollectChanceRowsOptions {
  chance: number
  perks: Map<string, PerkData>
  rolledPerk: PerkData
  entries: EntryWithMeta[]
}

function collectChanceRows(
  { chance, perks, entries, rolledPerk }: CollectChanceRowsOptions,
  result: PerkBucketChanceRow[] = [],
) {
  let weightSum = 0
  for (const entry of entries) {
    if (entry.canRoll) {
      weightSum += entry.finalWeight
    }
  }

  for (const entry of entries) {
    const entryChance = chance * (entry.canRoll ? entry.finalWeight / weightSum : 0)
    if (isPerkEntry(entry)) {
      const perk = perks.get(entry.PerkID)
      result.push({
        chance: entryChance,
        isRolled: rolledPerk?.PerkID === entry.PerkID,
        canRoll: entry.canRoll,
        perk,
        perkId: entry.PerkID,
      })
    } else {
      collectChanceRows(
        {
          chance: entryChance,
          perks,
          entries: entry.Entries,
          rolledPerk,
        },
        result,
      )
    }
  }
  return result
}

function getLabelWeight(
  entry: PerkBucketEntry,
  perks: Map<string, PerkData>,
  labels: Map<string, PerkExclusiveLabelData>,
  ignoreLabels: boolean,
) {
  let labelWeight = 0
  if (isPerkEntry(entry) && !ignoreLabels) {
    const perk = perks.get(entry.PerkID)
    // assume label weights are just summed
    for (const label of perk.ExclusiveLabels) {
      labelWeight = Math.max(labelWeight, labels.get(label)?.Weight || 0)
    }
  }
  return labelWeight || 100
}

function canPerkRoll(perk: PerkData, rolledPerks: PerkData[]) {
  for (const existingPerk of rolledPerks) {
    if (getExclusiveLabelIntersection(existingPerk, perk).length) {
      return false
    }
  }
  return true
}

function collapseChanceRows(rows: PerkBucketChanceRow[]): PerkBucketChanceRow[] {
  const groups = groupBy(rows, (it) => it.perkId)
  const result: PerkBucketChanceRow[] = []
  for (const key in groups) {
    const group = groups[key]
    const chance = sumBy(group, (it) => it.chance)
    result.push({
      chance,
      perkId: group[0].perkId,
      perk: group[0].perk,
      canRoll: group[0].canRoll,
      isRolled: group[0].isRolled,
    })
  }
  return result
}

function dumpEntries(entries: EntryWithMeta[], level = 0) {
  const prefix = '  '.repeat(level)
  for (const entry of entries) {
    if (!isPerkEntry(entry)) {
      console.log(prefix, '[PBID]', entry.PerkBucketID)
      console.log(prefix, '- weight', entry.Weight)
      console.log(prefix, '- labelWeight', entry.labelWeight)
      console.log(prefix, '- finalWeight', entry.finalWeight)
      dumpEntries(entry.Entries, level + 1)
    } else {
      console.log(prefix, '[PERK]', entry.PerkID)
      console.log(prefix, '- weight', entry.Weight)
      console.log(prefix, '- labelWeight', entry.labelWeight)
      console.log(prefix, '- finalWeight', entry.finalWeight)
    }
  }
}
