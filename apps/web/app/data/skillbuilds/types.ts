import { AttributeRef } from "@nw-data/common"
import { Ability } from "@nw-data/generated"

export interface SkillSet {
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

export interface SkillSetRecord extends SkillSet {
  /**
   * ID in database
   */
  id: string
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
}

export interface SkillBuildRow {
  /**
   * The player item stored in database
   */
  record: SkillSetRecord
  /**
   * The abilities of the player
   */
  abilities: Ability[]
}
