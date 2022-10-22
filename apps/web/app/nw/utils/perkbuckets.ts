import { Perkbuckets, Perks } from '@nw-data/types'
import { uniq } from 'lodash'

export function getPerkbucketPerkIds(bucket: Perkbuckets) {
  return Object.keys(bucket || {})
    .filter((it) => it.match(/Perk\d+/))
    .map((it) => bucket[it] as string)
    .filter((it) => !!it)
}

export function collectPerkbucketPerkIds(
  bucket: Perkbuckets,
  buckets: Map<string, Perkbuckets>,
  result: Set<string> = new Set()
) {
  if (!bucket) {
    return result
  }
  const ids = getPerkbucketPerkIds(bucket)
  for (const id of ids) {
    if (!id.startsWith('[PBID]')) {
      result.add(id)
      continue
    }
    const subBucket = buckets.get(id.replace('[PBID]', ''))
    collectPerkbucketPerkIds(subBucket, buckets, result)
  }
  return result
}

export function collectPerkbucketPerks(
  bucket: Perkbuckets,
  buckets: Map<string, Perkbuckets>,
  perks: Map<string, Perks>
) {
  const ids = collectPerkbucketPerkIds(bucket, buckets)
  return Array.from(ids).map((id) => perks.get(id))
}

export function getPerkbucketPerks(bucket: Perkbuckets, perks: Map<string, Perks>) {
  return uniq(getPerkbucketPerkIds(bucket)).map((it) => perks.get(it))
}
