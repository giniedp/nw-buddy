import { AbilityData } from '@nw-data/generated'
import { SkillTreeRow, SkillTreeRecord } from './types'

export function buildSkillTreeRows(records: SkillTreeRecord[], abilities: Map<string, AbilityData>): SkillTreeRow[] {
  if (!records || !abilities) {
    return []
  }
  return records.map((it) => buildSkillTreeRow(it, abilities))
}

export function buildSkillTreeRow(record: SkillTreeRecord, abilities: Map<string, AbilityData>): SkillTreeRow {
  if (!record || !abilities) {
    return null
  }
  return {
    record: record,
    abilities: [...(record.tree1 || []), ...(record.tree2 || [])]
      .map((it) => abilities?.get(it))
      .filter((it) => it?.IsActiveAbility),
  }
}
