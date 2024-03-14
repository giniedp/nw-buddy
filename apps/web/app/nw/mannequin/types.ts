import { AttributeRef, EquipSlotId } from '@nw-data/common'
import {
  Ability,
  Affixstats,
  Attributeconstitution,
  Attributedexterity,
  Attributefocus,
  Attributeintelligence,
  Attributestrength,
  CooldownsPlayer,
  Damagetable,
  Housingitems,
  ItemDefinitionMaster,
  ItemdefinitionsAmmo,
  ItemdefinitionsArmor,
  ItemdefinitionsConsumables,
  ItemdefinitionsRunes,
  ItemdefinitionsWeapons,
  Perks,
  PvpbalanceArena,
  PvpbalanceOpenworld,
  PvpbalanceOutpostrush,
  PvpbalanceWar,
  Statuseffect,
  Statuseffectcategories,
  WeaponTag,
} from '@nw-data/generated'
import { Observable } from 'rxjs'
import type { ModifierKey } from './modifier'

export type CombatMode = 'pve' | 'pvpArena' | 'pvpOpenworld' | 'pvpWar' | 'pvpOutpostrush'
export type CritType = 'crit' | 'backstab' | 'headshot'
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
  enforcedEffects?: Array<{ id: string; stack: number }>
  /**
   * Enforced abilities
   */
  enforcedAbilities?: Array<{ id: string; stack: number }>
  /**
   * Skill tree for the equpped weapon
   */
  equippedSkills1?: EquppedSkills
  /**
   * Skill tree for the equpped weapon
   */
  equippedSkills2?: EquppedSkills
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

  combatMode?: CombatMode
  isInCombat?: boolean
  distFromDefender?: number
  myHealthPercent?: number
  myManaPercent?: number
  myStaminaPercent?: number
  numAroundMe?: number
  numHits?: number
  targetHealthPercent?: number
  critType?: CritType
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
  effectCategories: Map<string, Statuseffectcategories>
  abilities: Map<string, Ability>
  affixes: Map<string, Affixstats>
  attrStr: Attributestrength[]
  attrDex: Attributedexterity[]
  attrInt: Attributeintelligence[]
  attrFoc: Attributefocus[]
  attrCon: Attributeconstitution[]
  cooldowns: Map<string, CooldownsPlayer>
  pvpBalanceArena: Array<PvpbalanceArena>
  pvpBalanceOpenworld: Array<PvpbalanceOpenworld>
  pvpBalanceWar: Array<PvpbalanceWar>
  pvpBalanceOutpostrush: Array<PvpbalanceOutpostrush>
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
  magnify: number
  total: number
  health?: number
  heal?: number
  scale: number
  abilities: string[]
}

export interface ActiveBonus {
  key: ModifierKey<number>
  value: number
  name: string
}

export interface ActiveAbility {
  scale: number
  ability: Ability
  selfEffects: Statuseffect[]
  weapon?: ActiveWeapon
  perk?: ActivePerk
  attribute?: boolean
  cooldown?: CooldownsPlayer
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
  bonuses: ActiveBonus[]
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

export type Observed<T> = { [K in keyof T]: Observable<T[K]> }
