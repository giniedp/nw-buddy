
export interface TaggedRecord {
  tags?: string[]
}

export function collectTagsFromRecords<T extends TaggedRecord>(records: T[], activeTags: string[]) {
  const tags: string[] = []
  for (const record of records || []) {
    for (const tag of record.tags || []) {
      if (!tags.includes(tag)) {
        tags.push(tag)
      }
    }
  }
  return tags.sort().map((tag) => ({ tag, active: activeTags.includes(tag) }))
}

export function filterRecordsByTags<T extends TaggedRecord>(records: T[], tags: string[]) {
  if (!tags?.length || !records?.length) {
    return records
  }
  return records.filter((it) => it.tags?.some((tag) => tags.includes(tag)))
}

export function toggleTagInList(tags: string[], tag: string) {
  if (!tag) {
    return tags
  }
  tags = [...(tags || [])]
  const index = tags.indexOf(tag)
  if (index >= 0) {
    tags.splice(index, 1)
  } else {
    tags.push(tag)
  }
  return tags
}
