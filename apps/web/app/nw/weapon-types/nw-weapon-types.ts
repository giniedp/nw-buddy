import { DamageType, StatusEffectCategory } from '@nw-data/generated'
import { CaseInsensitiveMap, eqCaseInsensitive } from '~/utils'

export interface NwWeaponType {
  WeaponTypeID: string
  WeaponTag: string
  UIName: string
  MasteryName: string
  Tree1Name: string
  Tree2Name: string
  GroupName: string
  CategoryName: string
  IconPath: string
  IconPathSmall: string
  DamageType: DamageType
  DamageTablePrefix: string
  StatsRef: string
  ProgressionId: string
}

export const NW_WEAPON_TYPES: Array<NwWeaponType> = [
  // ONE HANDED
  {
    UIName: 'ui_straightsword',
    MasteryName: 'ui_straightsword_mastery',
    Tree1Name: 'ui_sword',
    Tree2Name: 'ui_shield',
    WeaponTypeID: 'Swords',
    WeaponTag: 'Sword',
    DamageType: 'Slash',
    GroupName: 'Swords_GroupName',
    CategoryName: 'ui_onehanded_weapons',
    IconPath: 'assets/icons/weapons/1hsword.png',
    IconPathSmall: 'assets/icons/weapons/1hswordsmall.png',
    DamageTablePrefix: '1H_Sword_',
    StatsRef: 'SwordT5',
    ProgressionId: 'SwordAbilityTable',
  },
  {
    UIName: 'ui_rapier',
    MasteryName: 'ui_rapier_mastery',
    Tree1Name: 'ui_blood',
    Tree2Name: 'ui_evade',
    WeaponTypeID: 'Rapiers',
    WeaponTag: 'Rapier',
    DamageType: 'Thrust',
    GroupName: 'Rapiers_GroupName',
    CategoryName: 'ui_onehanded_weapons',
    IconPath: 'assets/icons/weapons/1hrapier.png',
    IconPathSmall: 'assets/icons/weapons/1hrapiersmall.png',
    DamageTablePrefix: '1H_Rapier_',
    StatsRef: 'RapierT5',
    ProgressionId: 'RapierAbilityTable',
  },
  {
    UIName: 'ui_hatchet',
    MasteryName: 'ui_hatchet_mastery',
    Tree1Name: 'ui_hatchet_tree1',
    Tree2Name: 'ui_hatchet_tree2',
    WeaponTypeID: 'Hatchets',
    WeaponTag: 'Axe',
    DamageType: 'Slash',
    GroupName: 'Hatchets_GroupName',
    CategoryName: 'ui_onehanded_weapons',
    IconPath: 'assets/icons/weapons/1hhatchet.png',
    IconPathSmall: 'assets/icons/weapons/1hhatchetsmall.png',
    DamageTablePrefix: 'Hatchet_',
    StatsRef: 'HatchetT5',
    ProgressionId: 'HatchetAbilityTable',
  },
  {
    UIName: 'ui_flail',
    MasteryName: 'ui_flail_mastery',
    Tree1Name: 'ui_flail_tree1',
    Tree2Name: 'ui_flail_tree2',
    WeaponTypeID: 'Flail',
    WeaponTag: 'Flail',
    DamageType: 'Strike',
    GroupName: 'Flails_GroupName',
    CategoryName: 'ui_onehanded_weapons',
    IconPath: 'assets/icons/weapons/1hflail.png',
    IconPathSmall: 'assets/icons/weapons/1hflailsmall.png',
    DamageTablePrefix: '1H_Flail_',
    StatsRef: 'FlailT5',
    ProgressionId: 'FlailAbilityTable',
  },
  // TWO HANDED
  {
    UIName: 'ui_spear',
    MasteryName: 'ui_spear_mastery',
    Tree1Name: 'ui_spear_tree1',
    Tree2Name: 'ui_spear_tree2',
    WeaponTypeID: 'Spears',
    WeaponTag: 'Spear',
    DamageType: 'Thrust',
    GroupName: 'Spears_GroupName',
    CategoryName: 'ui_twohanded_weapons',
    IconPath: 'assets/icons/weapons/speara.png',
    IconPathSmall: 'assets/icons/weapons/spearasmall.png',
    DamageTablePrefix: '2H_Spear_',
    StatsRef: 'SpearT5',
    ProgressionId: 'SpearAbilityTable',
  },
  {
    UIName: 'ui_greataxe',
    MasteryName: 'ui_greataxe_mastery',
    Tree1Name: 'ui_greataxe_tree1',
    Tree2Name: 'ui_greataxe_tree2',
    WeaponTypeID: 'GreatAxe',
    WeaponTag: 'GreatAxe',
    DamageType: 'Slash',
    GroupName: 'GreatAxe_GroupName',
    CategoryName: 'ui_twohanded_weapons',
    IconPath: 'assets/icons/weapons/2hgreataxe.png',
    IconPathSmall: 'assets/icons/weapons/2hgreataxesmall.png',
    DamageTablePrefix: 'GreatAxe_',
    StatsRef: '2HAxeT5',
    ProgressionId: 'GreatAxeAbilityTable',
  },
  {
    UIName: 'ui_warhammer',
    MasteryName: 'ui_warhammer_mastery',
    Tree1Name: 'ui_juggernaut',
    Tree2Name: 'ui_crowdcrusher',
    WeaponTypeID: 'WarHammers',
    WeaponTag: 'Warhammer',
    DamageType: 'Strike',
    GroupName: 'WarHammers_GroupName',
    CategoryName: 'ui_twohanded_weapons',
    IconPath: 'assets/icons/weapons/2hdemohammer.png',
    IconPathSmall: 'assets/icons/weapons/2hdemohammersmall.png',
    DamageTablePrefix: 'Warhammer_',
    StatsRef: '2HHammerT5',
    ProgressionId: 'WarHammerAbilityTable',
  },
  {
    UIName: 'ui_greatsword',
    MasteryName: 'ui_greatsword_mastery',
    Tree1Name: 'ui_greatsword_tree1',
    Tree2Name: 'ui_greatsword_tree2',
    WeaponTypeID: 'Greatsword',
    WeaponTag: 'Greatsword',
    DamageType: 'Slash',
    GroupName: 'Greatsword_GroupName',
    CategoryName: 'ui_twohanded_weapons',
    IconPath: 'assets/icons/weapons/2hgreatsword.png',
    IconPathSmall: 'assets/icons/weapons/2hgreatswordsmall.png',
    DamageTablePrefix: 'GreatSword_',
    StatsRef: '2hGreatSwordT5',
    ProgressionId: 'GreatSwordAbilityTable',
  },

  // RANGED
  {
    UIName: 'ui_musket',
    MasteryName: 'ui_musket_mastery',
    Tree1Name: 'ui_musket_tree1',
    Tree2Name: 'ui_musket_tree2',
    WeaponTypeID: 'Muskets',
    WeaponTag: 'Rifle',
    DamageType: 'Thrust',
    GroupName: 'Muskets_GroupName',
    CategoryName: 'ui_ranged_weapons',
    IconPath: 'assets/icons/weapons/2hmusketa.png',
    IconPathSmall: 'assets/icons/weapons/2hmusketasmall.png',
    DamageTablePrefix: 'Musket',
    StatsRef: 'MusketT5',
    ProgressionId: 'MusketAbilityTable',
  },
  {
    UIName: 'ui_bow',
    MasteryName: 'ui_bow_mastery',
    Tree1Name: 'ui_bow_tree1',
    Tree2Name: 'ui_bow_tree2',
    WeaponTypeID: 'Bows',
    WeaponTag: 'Bow',
    DamageType: 'Thrust',
    GroupName: 'Bows_GroupName',
    CategoryName: 'ui_ranged_weapons',
    IconPath: 'assets/icons/weapons/bowb.png',
    IconPathSmall: 'assets/icons/weapons/bowbsmall.png',
    DamageTablePrefix: 'Bow',
    StatsRef: 'BowT5',
    ProgressionId: 'BowAbilityTable',
  },
  {
    UIName: 'ui_blunderbuss',
    MasteryName: 'ui_blunderbuss_mastery',
    Tree1Name: 'ui_blunderbuss_tree1',
    Tree2Name: 'ui_blunderbuss_tree2',
    WeaponTypeID: 'Blunderbuss',
    WeaponTag: 'Blunderbuss',
    DamageType: 'Thrust',
    GroupName: 'Blunderbuss_GroupName',
    CategoryName: 'ui_ranged_weapons',
    IconPath: 'assets/icons/weapons/blunderbuss.png',
    IconPathSmall: 'assets/icons/weapons/blunderbusssmall.png',
    DamageTablePrefix: 'Blunderbuss_',
    StatsRef: 'BlunderbussT5',
    ProgressionId: 'BlunderbussAbilityTable',
  },

  // MAGIC
  {
    UIName: 'ui_firestaff',
    MasteryName: 'ui_firemagic_mastery',
    Tree1Name: 'ui_firestaff_tree1',
    Tree2Name: 'ui_firestaff_tree2',
    WeaponTypeID: 'StavesFire',
    WeaponTag: 'Fire',
    DamageType: 'Fire',
    GroupName: 'StavesFire_GroupName',
    CategoryName: 'ui_magic_skills',
    IconPath: 'assets/icons/weapons/stafffire.png',
    IconPathSmall: 'assets/icons/weapons/stafffiresmall.png',
    DamageTablePrefix: 'Firestaff_',
    StatsRef: 'FireStaffT5',
    ProgressionId: 'FireMagicAbilityTable',
  },
  {
    UIName: 'ui_lifestaff',
    MasteryName: 'ui_lifemagic_mastery',
    Tree1Name: 'ui_lifestaff_tree1',
    Tree2Name: 'ui_lifestaff_tree2',
    WeaponTypeID: 'StavesLife',
    WeaponTag: 'Heal',
    DamageType: 'Nature',
    GroupName: 'StavesLife_GroupName',
    CategoryName: 'ui_magic_skills',
    IconPath: 'assets/icons/weapons/stafflife.png',
    IconPathSmall: 'assets/icons/weapons/stafflifesmall.png',
    DamageTablePrefix: 'LifeStaff_',
    StatsRef: 'LifeStaffT5',
    ProgressionId: 'LifeMagicAbilityTable',
  },
  {
    UIName: 'ui_icemagic',
    MasteryName: 'ui_icemagic_mastery',
    Tree1Name: 'ui_icemagic_tree1',
    Tree2Name: 'ui_icemagic_tree2',
    WeaponTypeID: 'GauntletIce',
    WeaponTag: 'Ice',
    DamageType: 'Ice',
    GroupName: 'GauntletIce_GroupName',
    CategoryName: 'ui_magic_skills',
    IconPath: 'assets/icons/weapons/icegauntlet.png',
    IconPathSmall: 'assets/icons/weapons/icegauntletsmall.png',
    DamageTablePrefix: 'IceMagic_',
    StatsRef: '1hElementalGauntlet_IceT5',
    ProgressionId: 'IceMagicAbilityTable',
  },
  {
    UIName: 'ui_voidmagic',
    MasteryName: 'ui_voidmagic_mastery',
    Tree1Name: 'ui_voidmagic_tree1',
    Tree2Name: 'ui_voidmagic_tree2',
    WeaponTypeID: 'GauntletVoid',
    WeaponTag: 'VoidGauntlet',
    DamageType: 'Corruption',
    GroupName: 'GauntletVoid_GroupName',
    CategoryName: 'ui_magic_skills',
    IconPath: 'assets/icons/weapons/voidgauntlet.png',
    IconPathSmall: 'assets/icons/weapons/voidgauntletsmall.png',
    DamageTablePrefix: 'VoidGauntlet_',
    StatsRef: 'VoidGauntletT5',
    ProgressionId: 'VoidGauntletAbilityTable',
  },
]

export const NW_DAMAGE_TYPE_ICONS = new CaseInsensitiveMap(
  Object.entries({
    Acid: 'assets/icons/tooltip/icon_tooltip_acid_opaque.png',
    Arcane: 'assets/icons/tooltip/icon_tooltip_arcane_opaque.png',
    Bleed: 'assets/icons/tooltip/icon_tooltip_bleed_opaque.png',
    Blocked: 'assets/icons/tooltip/icon_tooltip_blocked_opaque.png',
    Bundle: 'assets/icons/tooltip/icon_tooltip_bundle_opaque.png',
    Corruption: 'assets/icons/tooltip/icon_tooltip_corruption_opaque.png',
    Disease: 'assets/icons/tooltip/icon_tooltip_disease_opaque.png',
    Falling: 'assets/icons/tooltip/icon_tooltip_falling_opaque.png',
    Fire: 'assets/icons/tooltip/icon_tooltip_fire_opaque.png',
    Frostbite: 'assets/icons/tooltip/icon_tooltip_frostbite_opaque.png',
    Ice: 'assets/icons/tooltip/icon_tooltip_ice_opaque.png',
    Lightning: 'assets/icons/tooltip/icon_tooltip_lightning_opaque.png',
    Magic: 'assets/icons/tooltip/icon_tooltip_magic_opaque.png',
    Nature: 'assets/icons/tooltip/icon_tooltip_nature_opaque.png',
    PhysFire: 'assets/icons/tooltip/icon_tooltip_physfire_opaque.png',
    Poison: 'assets/icons/tooltip/icon_tooltip_poison_opaque.png',
    Purchase: 'assets/icons/tooltip/icon_tooltip_purchase_opaque.png',
    Repair: 'assets/icons/tooltip/icon_tooltip_repair_opaque.png',
    Salvage: 'assets/icons/tooltip/icon_tooltip_salvage_opaque.png',
    Siege: 'assets/icons/tooltip/icon_tooltip_siege_opaque.png',
    Slash: 'assets/icons/tooltip/icon_tooltip_slash_opaque.png',
    Spirit: 'assets/icons/tooltip/icon_tooltip_spirit_opaque.png',
    Standard: 'assets/icons/tooltip/icon_tooltip_standard_opaque.png',
    Strike: 'assets/icons/tooltip/icon_tooltip_strike_opaque.png',
    Thrust: 'assets/icons/tooltip/icon_tooltip_thrust_opaque.png',
    Void: 'assets/icons/tooltip/icon_tooltip_void_opaque.png',
    unknown: 'assets/icons/tooltip/icon_unknown.png',

    Ancient: 'assets/icons/families/ancientbane1.png',
    Corrupted: 'assets/icons/families/corruptedbane1.png',
    AngryEarth: 'assets/icons/families/angryearthbane1.png',
    Lost: 'assets/icons/families/lostbane1.png',
    Beast: 'assets/icons/families/bestialbane1.png',
    Human: 'assets/icons/families/humanbane1.png',
    Varangian: 'assets/icons/families/humanbane1.png',
  }),
)

export const NW_WARD_TYPE_ICONS = new CaseInsensitiveMap(
  Object.entries({
    Ancient: 'assets/icons/families/ancientward1.png',
    Corrupted: 'assets/icons/families/corruptedward1.png',
    AngryEarth: 'assets/icons/families/angryearthward1.png',
    Lost: 'assets/icons/families/lostward1.png',
    Bestial: 'assets/icons/families/bestialward1.png',
    Human: 'assets/icons/families/humanward1.png',
    Varangian: 'assets/icons/families/humanward1.png',
  }),
)

export function damageTypeIcon(type: string, fallback?: string) {
  return NW_DAMAGE_TYPE_ICONS.get(type) || fallback || NW_DAMAGE_TYPE_ICONS.get('unknown')
}

export const NW_SE_CATEGORY_ICONS = new CaseInsensitiveMap(
  Object.entries({
    Bleed: 'assets/icons/tooltip/se_bleedt1.png',
    Burn: 'assets/icons/tooltip/se_burnt1.png',
    Disease: 'assets/icons/tooltip/se_diseaset1.png',
    Empower: 'assets/icons/tooltip/se_empowert1.png',
    Fortify: 'assets/icons/tooltip/se_fortifyt1.png',
    ArmorFortify: 'assets/icons/tooltip/se_fortifyt1.png',
    Haste: 'assets/icons/tooltip/se_haste.png',
    Poison: 'assets/icons/tooltip/se_poisont1.png',
    Frostbite: 'assets/icons/tooltip/se_icemagicfreeze.png',
  } satisfies Partial<Record<StatusEffectCategory, string>>),
)

export function statusEffectCategoryIcon(type: string) {
  return NW_SE_CATEGORY_ICONS.get(type)
}

export function getWeaponTypeInfo(byWeaponTag: string) {
  return NW_WEAPON_TYPES.find((it) => eqCaseInsensitive(it.WeaponTag, byWeaponTag))
}

export function getWeaponTypes() {
  return NW_WEAPON_TYPES
}
