import { AttributeRef } from '@nw-data/common'
import { AbilityData } from '@nw-data/generated'
import type { AppDbRecord } from '../app-db'

export interface SkillTree {
  /**
   * The weapon tag
   */
  weapon: string
  /**
   *
   */
  tree1: string[]
  /**
   *
   */
  tree2: string[]
}

export interface SkillTreeRecord extends SkillTree, AppDbRecord {
  /**
   * Name of the gearset
   */
  name: string
  /**
   * The ipns private key
   */
  ipnsKey?: string
  /**
   * The ipns public name
   */
  ipnsName?: string
  /**
   * Assigned attribute points
   */
  attrs?: Record<AttributeRef, number>
  /**
   * User defined tags
   */
  tags?: string[]
  /**
   * The status of the skill set
   */
  status?: 'public' | 'private'
}

export interface SkillTreeRow {
  /**
   * The player item stored in database
   */
  record: SkillTreeRecord
  /**
   * The abilities of the player
   */
  abilities: AbilityData[]
}
