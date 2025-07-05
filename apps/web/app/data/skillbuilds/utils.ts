import { AbilityData } from '@nw-data/generated'
import { SkillTreeRow, SkillTreeRecord } from './types'

export function buildSkillSetRows(records: SkillTreeRecord[], abilities: Map<string, AbilityData>): SkillTreeRow[] {
  if (!records || !abilities) {
    return []
  }
  return records.map((it) => buildSkillSetRow(it, abilities))
}

export function buildSkillSetRow(record: SkillTreeRecord, abilities: Map<string, AbilityData>): SkillTreeRow {
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
