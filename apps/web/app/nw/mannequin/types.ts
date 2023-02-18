import {
  Ability,
  Affixstats,
  Attributeconstitution,
  Attributedexterity,
  Attributefocus,
  Attributeintelligence,
  Attributestrength,
  Damagetable,
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
  equippedItems?: EquippedItem[]
  /**
   * Assigned attribute points
   */
  assignedAttributes?: Record<AttributeRef, number>
  /**
   * Enforced status effects
   */
  enforcedEffects?: Array<{ id: string, stack: number }>
  /**
   * Enforced abilities
   */
  enforcedAbilities?: Array<{ id: string, stack: number }>
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
  /**
   * The selected Attack
   */
  selectedAttack?: string

  isInCombat?: boolean
  isPvP?: string
  distFromDefender?: number
  myHealthPercent?: number
  myManaPercent?: number
  myStaminaPercent?: number
  numAroundMe?: number
  numHits?: number
  targetHealthPercent?: number
}

export interface DbSlice {
  items: Map<string, ItemDefinitionMaster>
  housings: Map<string, Housingitems>
  weapons: Map<string, ItemdefinitionsWeapons>
  runes: Map<string, ItemdefinitionsRunes>
  armors: Map<string, ItemdefinitionsArmor>
  ammos: Map<string, ItemdefinitionsAmmo>
  consumables: Map<string, ItemdefinitionsConsumables>
  damagaTable: Damagetable[]
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

export interface EquippedItem {
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
  health?: number
  scale: number
  abilities: string[]
}

export interface ActiveAbility {
  // scale: number
  ability: Ability
  selfEffects: Statuseffect[]
  weapon?: ActiveWeapon
  perk?: ActivePerk
  attribute?: boolean
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
export interface ActiveConsumable {
  item: ItemDefinitionMaster
  consumable: ItemdefinitionsConsumables
}

export interface ActiveMods {
  attributes: ActiveAttributes
  perks: ActivePerk[]
  effects: ActiveEffect[]
  abilities: ActiveAbility[]
  consumables: ActiveConsumable[]
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
   * Perk from which the status effect has been activated
   */
  perk?: ActivePerk
  /**
   * Ability from which the status effect has been activated
   */
  ability?: Ability
}

export interface AttributeModsSource {
  perks: ActivePerk[]
  effects: ActiveEffect[]
}

export type SelectorOf<T> = { [K in keyof T]: Observable<T[K]> }
