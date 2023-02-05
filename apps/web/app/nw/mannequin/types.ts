import {
  Ability,
  Affixstats,
  Attributeconstitution,
  Attributedexterity,
  Attributefocus,
  Attributeintelligence,
  Attributestrength,
  Housingitems,
  ItemDefinitionMaster,
  ItemdefinitionsAmmo,
  ItemdefinitionsArmor,
  ItemdefinitionsConsumables,
  ItemdefinitionsRunes,
  ItemdefinitionsWeapons,
  Perks,
  Statuseffect,
  WeaponTag,
} from '@nw-data/types'
import { Observable } from 'rxjs'
import { AttributeRef } from '../attributes/nw-attributes'
import { EquipSlotId } from '../utils/equip-slot'

export interface MannequinState {
  /**
   * Current character level
   */
  level?: number
  /**
   * All items being equpped on the player
   * including consumed buff food and placed trophies
   */
  equippedItems?: EquppedItem[]
  /**
   * Assigned attribute points
   */
  assignedAttributes?: Record<AttributeRef, number>
  /**
   * Skill tree for the equpped weapon
   */
  equppedSkills1?: EquppedSkills
  /**
   * Skill tree for the equpped weapon
   */
  equppedSkills2?: EquppedSkills
  /**
   * Abilities that have been activated by the user
   */
  activatedAbilities?: string[]
  /**
   * The active weapon slot
   */
  weaponActive?: 'primary' | 'secondary'
  /**
   * Whether the active weapon is unsheathed
   */
  weaponUnsheathed?: boolean
}

export interface DbSlice {
  items: Map<string, ItemDefinitionMaster>
  housings: Map<string, Housingitems>
  weapons: Map<string, ItemdefinitionsWeapons>
  runes: Map<string, ItemdefinitionsRunes>
  armors: Map<string, ItemdefinitionsArmor>
  ammos: Map<string, ItemdefinitionsAmmo>
  consumables: Map<string, ItemdefinitionsConsumables>
  perks: Map<string, Perks>
  effects: Map<string, Statuseffect>
  abilities: Map<string, Ability>
  affixes: Map<string, Affixstats>
  attrStr: Attributestrength[]
  attrDex: Attributedexterity[]
  attrInt: Attributeintelligence[]
  attrFoc: Attributefocus[]
  attrCon: Attributeconstitution[]
}

export interface EquppedItem {
  slot: EquipSlotId
  itemId: string
  gearScore?: number
  perks: Record<string, string>
}

export interface EquppedSkills {
  weapon: string
  tree1: string[]
  tree2: string[]
}

export interface ActiveWeapon {
  slot: EquipSlotId
  item: ItemDefinitionMaster
  weapon: ItemdefinitionsWeapons
  weaponTag: WeaponTag
  ammo: ItemdefinitionsAmmo
  gearScore: number
  unsheathed: boolean
}

export interface ActiveAmmo {
  item: ItemDefinitionMaster
  ammo: ItemdefinitionsAmmo
}

export type ActiveAttributes = Record<AttributeRef, ActiveAttribute>

export interface ActiveAttribute {
  base: number
  bonus: number
  assigned: number
  total: number
  scale: number
  abilities: string[]
}

export interface AplicableAbility {
  item: ItemDefinitionMaster
  weapon: ItemdefinitionsWeapons
  ability: Ability
}

export interface ActivePerk {
  slot: EquipSlotId
  item: ItemDefinitionMaster
  perk: Perks
  gearScore: number
  weapon: ItemdefinitionsWeapons | null
  armor: ItemdefinitionsArmor | null
  rune: ItemdefinitionsRunes | null
  affix: Affixstats | null
}

export interface ActiveEffect {
  /**
   * The status effect
   */
  effect: Statuseffect
  /**
   * Item from which the status effect has been activated
   */
  item?: ItemDefinitionMaster | Housingitems
  /**
   * Consumable from which the status effect has been activated
   */
  consumable?: ItemdefinitionsConsumables
  /**
   * Ability from which the status effect has been activated
   */
  ability?: Ability
}

export interface ActiveMods {
  perks: ActivePerk[]
  effects: ActiveEffect[]
}

export type SelectorOf<T> = { [K in keyof T]: Observable<T[K]> }
