import { injectAppDB } from '../db'
import { DBT_SKILL_TREES } from './constants'
import { SkillTreeRecord } from './types'

export type SkillTreesDB = ReturnType<typeof injectSkillTreesDB>
export function injectSkillTreesDB() {
  return injectAppDB().table<SkillTreeRecord>(DBT_SKILL_TREES)
}
