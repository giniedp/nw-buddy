import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  BucketEntry,
  getExclusiveLabelIntersection,
  getItemPerkIds,
  isPerkApplicableToItem,
  isPerkEntry,
  isPerkExcludedFromItem,
  PerkBucket,
  PerkBucketEntry,
} from '@nw-data/common'
import { MasterItemDefinitions, PerkData, PerkExclusiveLabelData } from '@nw-data/generated'
import { groupBy, sumBy, uniq, uniqBy } from 'lodash'
import { combineLatest, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'

export interface PerkBucketDetailState {
  item: MasterItemDefinitions
  perkMap: Map<string, PerkData>
  perkBucket: PerkBucket
  labelMap: Map<string, PerkExclusiveLabelData>
  lockedPerkIds: string[]
}

export interface PerkBucketChanceRow {
  perkId: string
  perk: PerkData
  chance: number
  locked: boolean
}

export const PerkBucketDetailStore = signalStore(
  withState<PerkBucketDetailState>({
    item: null,
    perkMap: new Map(),
    labelMap: new Map(),
    perkBucket: null,
    lockedPerkIds: [],
  }),
  withMethods((state) => {
    const db = injectNwData()
    return {
      connect: rxMethod<{ perkBucketId: string; itemId: string }>((input) => {
        return input.pipe(
          switchMap(({ itemId, perkBucketId }) => {
            return combineLatest({
              item: db.itemsById(itemId),
              perkBucket: db.perkBucketsById(perkBucketId),
              perkMap: db.perksByIdMap(),
              labelMap: db.perksExclusiveLabelByIdMap(),
            })
          }),
          map(({ item, perkBucket, perkMap, labelMap }) => {
            patchState(state, {
              item,
              perkMap,
              perkBucket,
              labelMap,
            })
          }),
        )
      }),
    }
  }),
  withComputed(({ item, perkMap, perkBucket, labelMap }) => {
    const lockedPerks = computed(() => {
      if (!perkMap() || !perkBucket()) {
        return []
      }
      return getItemPerkIds(item()).map((it) => perkMap().get(it))
    })
    const reduced = computed(() => {
      if (!perkMap() || !perkBucket()) {
        return null
      }
      console.log({ bucket: perkBucket() })
      return reducePerkBucket({
        bucket: perkBucket(),
        item: item(),
        perks: perkMap(),
        labels: labelMap(),
        lockedPerks: lockedPerks(),
      })
    })
    return {
      rows: computed(() => {
        const bucket = reduced()
        if (!bucket) {
          return []
        }
        let rows = collectChanceRows({
          chance: bucket.PerkChance,
          ignoreLabels: bucket.IgnoreExclusiveLabelWeights,
          perks: perkMap(),
          labels: labelMap(),
          entries: bucket.Entries,
        })
        rows = collapseChanceRows(rows)
        rows = rows.sort((a, b) => b.chance - a.chance)

        return rows
      }),
    }
  }),
)

function reducePerkBucket<T extends PerkBucket | BucketEntry>({
  bucket,
  perks,
  labels,
  item,
  lockedPerks,
}: {
  bucket: T
  perks: Map<string, PerkData>
  labels: Map<string, PerkExclusiveLabelData>
  item: MasterItemDefinitions
  lockedPerks: PerkData[]
}): T {
  const result = { ...bucket }
  result.Entries = reducePerkEntries({
    entries: bucket.Entries,
    perks,
    labels,
    item,
    lockedPerks,
  })
  return result
}

function reducePerkEntries({
  entries,
  perks,
  labels,
  item,
  lockedPerks,
}: {
  entries: Array<PerkBucketEntry>
  perks: Map<string, PerkData>
  labels: Map<string, PerkExclusiveLabelData>
  item: MasterItemDefinitions
  lockedPerks: PerkData[]
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
      let isLocked = false
      for (const locked of lockedPerks) {
        isLocked ||= !!getExclusiveLabelIntersection(perk, locked).length
      }
      if (!isLocked) {
        result.push(entry)
      }
    } else {
      const bucket = reducePerkBucket({
        bucket: entry,
        perks,
        labels,
        item,
        lockedPerks,
      })
      if (bucket.Entries.length) {
        result.push(bucket)
      }
    }
  }
  return result
}

export interface CollectChanceRowsOptions {
  chance: number
  ignoreLabels: boolean
  perks: Map<string, PerkData>
  labels: Map<string, PerkExclusiveLabelData>
  entries: PerkBucketEntry[]
}

function collectChanceRows(
  { chance, ignoreLabels, perks, labels, entries }: CollectChanceRowsOptions,
  result: PerkBucketChanceRow[] = [],
) {
  let weightSum = 0
  for (const entry of entries) {
    const entryWeight = entry.Weight * (ignoreLabels ? 1 : getLabelWeight(entry, perks, labels))
    weightSum += entryWeight
  }
  for (const entry of entries) {
    const entryWeight = entry.Weight * (ignoreLabels ? 1 : getLabelWeight(entry, perks, labels))
    const entryChance = chance * (entryWeight / weightSum)
    if (isPerkEntry(entry)) {
      result.push({
        chance: entryChance,
        locked: false,
        perk: perks.get(entry.PerkID),
        perkId: entry.PerkID,
      })
    } else {
      collectChanceRows(
        {
          chance: entryChance,
          perks,
          labels,
          ignoreLabels,
          entries: entry.Entries,
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
) {
  if (!isPerkEntry(entry)) {
    return 1
  }
  const perk = perks.get(entry.PerkID)
  let labelWeight = 0
  for (const label of perk.ExclusiveLabels) {
    labelWeight += labels.get(label)?.Weight || 0
  }
  if (!labelWeight) {
    console.warn(`Perk ${perk.PerkID} has no label weight, fallback to1`)
    labelWeight = 1
  }
  return labelWeight
}

function collapseChanceRows(rows: PerkBucketChanceRow[]): PerkBucketChanceRow[] {
  const groups = groupBy(rows, (it) => it.perkId)
  const result: PerkBucketChanceRow[] = []
  for (const key in groups) {
    const group = groups[key]
    result.push({
      chance: sumBy(group, (it) => it.chance),
      perkId: group[0].perkId,
      perk: group[0].perk,
      locked: group[0].locked,
    })
  }
  return result
}
