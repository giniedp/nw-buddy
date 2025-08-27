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

export type LabelWeightMode = 'max' | 'avg' | 'sum'
export interface PerkBucketDetailState {
  showWeights: boolean
  defaultWeight: number
  defaultWeightOptions: number[]
  labelMode: LabelWeightMode
  item: MasterItemDefinitions
  perkMap: Map<string, PerkData>
  perkBucketMap: Map<string, PerkBucket>
  labelMap: Map<string, PerkExclusiveLabelData>
  lockedPerkIds: Record<string, string>
}

type PerkBucketEntryWithMeta = PerkBucketEntry & {
  canRoll?: boolean
  labels?: WeightedLabel[]
  labelWeight?: number
  totalWight?: number
}
export interface PerkBucketChanceRow {
  chance: number
  perkId: string
  perk: PerkData
  isRolled: boolean
  canRoll: boolean
  labels: WeightedLabel[]
  labelWeight: number
  totalWeight: number
}

export interface PerkBucketTab {
  key: string
  lockedPerkId: string
  bucket: PerkBucket
  rows: PerkBucketChanceRow[]
}

export const PerkBucketDetailStore = signalStore(
  withState<PerkBucketDetailState>({
    labelMode: 'max',
    defaultWeight: 1,
    defaultWeightOptions: [1, 100],
    showWeights: true,
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
      setLabelWeightMode(value: LabelWeightMode) {
        patchState(state, { labelMode: value })
      },
      setDefaultWeight(value: number) {
        patchState(state, { defaultWeight: value })
      },
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
  withComputed(({ item, perkMap, perkBucketMap, labelMap, labelMode, itemPerks, rolledPerks, defaultWeight }) => {
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
          labelMode: labelMode(),
          rolledPerks: existingPerks(),
          defaultWeight: defaultWeight(),
        })

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
  labelMode,
  defaultWeight,
}: {
  entries: PerkBucketEntryWithMeta[]
  perks: Map<string, PerkData>
  rolledPerk: PerkData
  rolledPerks: PerkData[]
  labels: Map<string, PerkExclusiveLabelData>
  ignoreLabels: boolean
  labelMode: LabelWeightMode
  defaultWeight: number
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
        labelMode,
        defaultWeight,
      })
    }
  }
  for (const entry of entries) {
    if (!isPerkEntry(entry)) {
      entry.canRoll = entry.Entries.some((it: PerkBucketEntryWithMeta) => it.canRoll)
    } else {
      const perk = perks.get(entry.PerkID)
      entry.canRoll = canPerkRoll(perk, rolledPerks) && !rolledPerk
    }
    entry.labels = getEntryLabels(entry, perks, labels)
    entry.labelWeight = getEntryLabelWeights(entry, labelMode, defaultWeight)
    entry.totalWight = entry.Weight * (ignoreLabels ? 1 : entry.labelWeight)
  }
}

export interface WeightedLabel {
  name: string
  weight: number
}

export interface CollectChanceRowsOptions {
  chance: number
  perks: Map<string, PerkData>
  rolledPerk: PerkData
  entries: PerkBucketEntryWithMeta[]
}

function collectChanceRows(
  { chance, perks, entries, rolledPerk }: CollectChanceRowsOptions,
  result: PerkBucketChanceRow[] = [],
) {
  let weightSum = 0
  for (const entry of entries) {
    if (entry.canRoll) {
      weightSum += entry.totalWight
    }
  }

  for (const entry of entries) {
    const entryChance = chance * (entry.canRoll ? entry.totalWight / weightSum : 0)
    if (isPerkEntry(entry)) {
      const perk = perks.get(entry.PerkID)
      result.push({
        chance: entryChance,
        isRolled: rolledPerk?.PerkID === entry.PerkID,
        canRoll: entry.canRoll,
        perk,
        perkId: entry.PerkID,
        labels: entry.labels,
        labelWeight: entry.labelWeight,
        totalWeight: entry.totalWight,
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

function getEntryLabels(
  entry: PerkBucketEntry,
  perks: Map<string, PerkData>,
  labels: Map<string, PerkExclusiveLabelData>,
): WeightedLabel[] {
  const result: WeightedLabel[] = []
  if (!isPerkEntry(entry)) {
    return result
  }
  const perk = perks.get(entry.PerkID)
  for (const label of perk.ExclusiveLabels) {
    result.push({
      name: label,
      weight: labels.get(label)?.Weight ?? 0,
    })
  }
  return result
}

function getEntryLabelWeights(entry: PerkBucketEntryWithMeta, mode: LabelWeightMode, defaultWeight: number) {
  if (!isPerkEntry(entry)) {
    return defaultWeight
  }

  let labelWeight = 0
  if (mode === 'sum') {
    for (const label of entry.labels) {
      labelWeight += label.weight
    }
  }

  if (mode === 'max') {
    for (const label of entry.labels) {
      labelWeight = Math.max(labelWeight, label.weight)
    }
  }

  if (mode === 'avg') {
    let count = 0
    for (const label of entry.labels) {
      const weight = label.weight
      if (weight) {
        labelWeight += weight
        count++
      }
    }
    labelWeight = labelWeight / count
  }

  if (!labelWeight) {
    console.warn(`Perk ${entry.PerkID} has no label weight, using default 100`)
    labelWeight = defaultWeight
  }
  return labelWeight
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
      labels: group[0].labels,
      labelWeight: group[0].labelWeight,
      totalWeight: group[0].totalWeight,
    })
  }
  return result
}
