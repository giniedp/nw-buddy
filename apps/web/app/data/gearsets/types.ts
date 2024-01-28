import { AttributeRef, EquipSlotId } from "@nw-data/common"
import { ItemInstance } from "../items/types"
import { SkillSet } from "../skillbuilds/types"

export type GearsetCreateMode = 'link' | 'copy'
export type GearsetSkillSlot = 'primary' | 'secondary'
export interface GearsetRecord {
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
  createMode?: GearsetCreateMode
  /**
   * Item slots for this gear
   */
  slots?: Partial<Record<EquipSlotId, string | ItemInstance>>
  /**
   * Assigned attribute points
   */
  attrs?: Record<AttributeRef, number>
  /**
   * Weapon skill builds
   */
  skills?: Partial<Record<GearsetSkillSlot, string | SkillSet>>
  /**
   * Profile image id
   */
  imageId?: string
  /**
   * Status effects enforced on this build
   */
  enforceEffects?: Array<{ id: string, stack: number }>
  /**
   * Abilities enforced on this build
   */
  enforceAbilities?: Array<{ id: string, stack: number }>
}
