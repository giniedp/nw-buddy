import type { NwDataSheets } from '../nw-data-sheets'

export async function resourceItemsForPerkId(db: NwDataSheets, perkId: string) {
  const buckets = await db.perkBucketsByPerkId(perkId)
  if (!buckets) {
    return null
  }
  for (const bucket of buckets) {
    const resources = await db.resourceItemsByPerkBucketId(bucket.PerkBucketID)
    if (!resources?.length) {
      continue
    }
    return resources
  }
  return null
}
