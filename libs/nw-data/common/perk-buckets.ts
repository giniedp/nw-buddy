import { MasterItemDefinitions, PerkBucketData, PerkData, PerkExclusiveLabelData, PerkType } from '@nw-data/generated'
import { uniq } from 'lodash'
import { isPerkApplicableToItem } from './perks'

export interface PerkBucket<T extends PerkBucketEntry = PerkBucketEntry> {
  PerkBucketID: string
  PerkChance: number
  PerkType: PerkType
  IgnoreExclusiveLabelWeights: boolean
  DisablePerkBiasing: boolean
  Entries: Array<T>
}

export type PerkBucketEntry = PerkEntry | BucketEntry

export interface PerkEntry {
  PerkID: string
  Weight: number
}

export interface BucketEntry extends PerkBucket {
  Weight: number
}

export function convertPerkBuckets(buckets: PerkBucketData[]) {
  const bucketsMap = new Map<string, PerkBucketData>()
  for (const it of buckets) {
    bucketsMap.set(it.PerkBucketID, it)
  }
  const result: PerkBucket[] = []
  for (const it of buckets) {
    if (!it.PerkBucketID.endsWith(`_Weights`)) {
      result.push(convertBucket({ bucket: it, bucketsMap }))
    }
  }
  return result
}

function convertBucket({
  bucket,
  bucketsMap,
}: {
  bucket: PerkBucketData
  bucketsMap: Map<string, PerkBucketData>
}): PerkBucket {
  const weights = bucketsMap.get(`${bucket.PerkBucketID}_Weights`)
  const keys = Object.keys(bucket || {}).filter((key) => key.match(/Perk\d+/))

  const result: PerkBucket = {
    Entries: [],
    DisablePerkBiasing: bucket.DisablePerkBiasing,
    IgnoreExclusiveLabelWeights: bucket.IgnoreExclusiveLabelWeights,
    PerkBucketID: bucket.PerkBucketID,
    PerkChance: bucket.PerkChance,
    PerkType: bucket.PerkType as PerkType,
  }

  for (const key of keys) {
    const perkId = bucket[key]
    const perkBucketId = perkId.replace('[PBID]', '')
    if (perkId === perkBucketId) {
      result.Entries.push({
        PerkID: perkId,
        Weight: Number(weights[key] || 0),
      } as PerkEntry)
    } else {
      const subBucket = convertBucket({
        bucket: bucketsMap.get(perkBucketId),
        bucketsMap,
      })
      result.Entries.push({
        ...subBucket,
        Weight: Number(weights[key] || 0),
      } as BucketEntry)
    }
  }
  result.Entries.sort((a, b) => b.Weight - a.Weight)
  return result
}

export function isPerkEntry(it: PerkEntry | BucketEntry): it is PerkEntry {
  return !!(it as PerkEntry).PerkID
}

export function getPerkBucketPerkIDs(bucket: PerkBucket, result: string[] = []): string[] {
  if (!bucket) {
    return result
  }
  for (const it of bucket.Entries) {
    if (isPerkEntry(it)) {
      result.push(it.PerkID)
    } else {
      getPerkBucketPerkIDs(it, result)
    }
  }
  return uniq(result)
}

export function getPerkBucketPerks(bucket: PerkBucket, perks: Map<string, PerkData>) {
  return uniq(getPerkBucketPerkIDs(bucket)).map((it) => perks.get(it))
}

export function resolvePerkBucketPerksForItem(
  bucket: PerkBucket,
  perks: Map<string, PerkData>,
  item: MasterItemDefinitions,
) {
  return getPerkBucketPerks(bucket, perks).filter((it) => isPerkApplicableToItem(it, item))
}
