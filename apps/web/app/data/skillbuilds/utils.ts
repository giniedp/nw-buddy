import { Ability } from "@nw-data/generated"
import { SkillBuildRow, SkillSetRecord } from "./types"

export function buildSkillSetRows(records: SkillSetRecord[], abilities: Map<string, Ability>): SkillBuildRow[] {
  if (!records || !abilities) {
    return []
  }
  return records.map((it) => buildSkillSetRow(it, abilities))
}

export function buildSkillSetRow(record: SkillSetRecord, abilities: Map<string, Ability>): SkillBuildRow {
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
