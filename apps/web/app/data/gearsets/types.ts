import { AttributeRef, EquipSlotId } from '@nw-data/common'
import type { AppDbRecord } from '../app-db'
import { ItemInstance } from '../items/types'
import { SkillTree } from '../skill-tree/types'

export type GearsetAttachItemMode = 'link' | 'copy'
export type GearsetSkillTreeRef = 'primary' | 'secondary'
export interface GearsetRecord extends AppDbRecord {
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
   * User description about the set
   */
  description?: string
  /**
   * User defined tags
   */
  tags?: string[]
  /**
   * The mode how new items should be stored in this set
   */
  createMode?: GearsetAttachItemMode
  /**
   * Item slots for this gear
   */
  slots?: Partial<Record<EquipSlotId, string | ItemInstance>>
  /**
   * Assigned attribute points
   */
  attrs?: Record<AttributeRef, number>
  /**
   * Where magnify attributes are assigned to
   */
  magnify?: AttributeRef
  /**
   * Weapon skill builds
   */
  skills?: Partial<Record<GearsetSkillTreeRef, string | SkillTree>>
  /**
   * Profile image id
   */
  imageId?: string
  /**
   * Status effects enforced on this build
   */
  enforceEffects?: Array<{ id: string; stack: number }>
  /**
   * Abilities enforced on this build
   */
  enforceAbilities?: Array<{ id: string; stack: number }>
  /**
   * The character level this gearset is designed for
   */
  level?: number
    /**
   * The status of the skill set
   */
  status?: 'public' | 'private'
}
