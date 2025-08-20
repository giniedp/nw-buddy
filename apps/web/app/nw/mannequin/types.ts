import { AttributeRef, EquipSlotId } from '@nw-data/common'
import {
  AbilityData,
  AffixStatData,
  AmmoItemDefinitions,
  ArenaBalanceData,
  ArmorItemDefinitions,
  AttributeDefinition,
  ConsumableItemDefinitions,
  CooldownData,
  DamageData,
  HouseItems,
  MasterItemDefinitions,
  OpenWorldBalanceData,
  OutpostRushBalanceData,
  PerkData,
  StatusEffectCategoryData,
  StatusEffectData,
  WarBalanceData,
  WeaponItemDefinitions,
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
  level: number
  /**
   * All items being equpped on the player
   * including consumed buff food and placed trophies
   */
  equippedItems: EquippedItem[]
  /**
   * Assigned attribute points
   */
  assignedAttributes: Record<AttributeRef, number>
  /**
   * Where magnify attributes are assigned to
   */
  magnifyPlacement: AttributeRef
  /**
   * Enforced status effects
   */
  enforcedEffects: Array<{ id: string; stack: number }>
  /**
   * Enforced abilities
   */
  enforcedAbilities: Array<{ id: string; stack: number }>
  /**
   * Skill tree for the equpped weapon
   */
  equippedSkills1: EquppedSkills
  /**
   * Skill tree for the equpped weapon
   */
  equippedSkills2: EquppedSkills
  /**
   * Abilities that have been activated by the user
   */
  activatedAbilities: string[]
  /**
   * The active weapon slot
   */
  weaponActive: 'primary' | 'secondary'
  /**
   * Whether the active weapon is unsheathed
   */
  weaponUnsheathed: boolean
  /**
   * The selected Attack
   */
  selectedAttack: string

  combatMode: CombatMode
  isInCombat: boolean
  distFromDefender: number
  myHealthPercent: number
  myManaPercent: number
  myStaminaPercent: number
  numAroundMe: number
  numHits: number
  targetHealthPercent: number
  critType: CritType
}

export interface DbSlice {
  items: Map<string, MasterItemDefinitions>
  housings: Map<string, HouseItems>
  weapons: Map<string, WeaponItemDefinitions>
  runes: Map<string, WeaponItemDefinitions>
  armors: Map<string, ArmorItemDefinitions>
  ammos: Map<string, AmmoItemDefinitions>
  consumables: Map<string, ConsumableItemDefinitions>
  damagaTable: DamageData[]
  perks: Map<string, PerkData>
  effects: Map<string, StatusEffectData>
  effectCategories: Map<string, StatusEffectCategoryData>
  abilities: Map<string, AbilityData>
  affixes: Map<string, AffixStatData>
  attrStr: AttributeDefinition[]
  attrDex: AttributeDefinition[]
  attrInt: AttributeDefinition[]
  attrFoc: AttributeDefinition[]
  attrCon: AttributeDefinition[]
  cooldowns: Map<string, CooldownData[]>
  pvpBalanceArena: Array<ArenaBalanceData>
  pvpBalanceOpenworld: Array<OpenWorldBalanceData>
  pvpBalanceWar: Array<WarBalanceData>
  pvpBalanceOutpostrush: Array<OutpostRushBalanceData>
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
  item: MasterItemDefinitions
  weapon: WeaponItemDefinitions
  weaponTag: WeaponTag
  ammo: AmmoItemDefinitions
  gearScore: number
  unsheathed: boolean
}

export interface ActiveAmmo {
  item: MasterItemDefinitions
  ammo: AmmoItemDefinitions
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
  ability: AbilityData
  selfEffects: StatusEffectData[]
  weapon?: ActiveWeapon
  perk?: ActivePerk
  attribute?: boolean
  cooldown?: CooldownData
}

export interface ActivePerk {
  slot: EquipSlotId
  item: MasterItemDefinitions
  perk: PerkData
  gearScore: number
  weapon: WeaponItemDefinitions | null
  armor: ArmorItemDefinitions | null
  rune: WeaponItemDefinitions | null
  affix: AffixStatData | null
}
export interface ActiveConsumable {
  item: MasterItemDefinitions
  consumable: ConsumableItemDefinitions
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
  effect: StatusEffectData
  /**
   * Item from which the status effect has been activated
   */
  item?: MasterItemDefinitions | HouseItems
  /**
   * Consumable from which the status effect has been activated
   */
  consumable?: ConsumableItemDefinitions
  /**
   * Perk from which the status effect has been activated
   */
  perk?: ActivePerk
  /**
   * Ability from which the status effect has been activated
   */
  ability?: AbilityData
}

export interface AttributeModsSource {
  perks: ActivePerk[]
  effects: ActiveEffect[]
  level: number
}

export type Observed<T> = { [K in keyof T]: Observable<T[K]> }
