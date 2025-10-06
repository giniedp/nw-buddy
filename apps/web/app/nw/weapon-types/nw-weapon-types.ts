import { DamageType, ProgressionCategory, StatusEffectCategory, WeaponTag } from '@nw-data/generated'
import { CaseInsensitiveMap, eqCaseInsensitive } from '~/utils'

export interface NwWeaponType {
  // TODO: get rid of `WeaponTypeID` and use `WeaponTag` everywhere instead
  // however `WeaponTypeID` is still used in skill tree records

  WeaponTypeID: string
  WeaponTag: WeaponTag
  ProgressionId: ProgressionCategory
  StatsRef: string
  DamageType: DamageType
  DamageTablePrefix: string

  UIName: string
  MasteryName: string
  Tree1Name: string
  Tree2Name: string
  GroupName: string
  CategoryName: string
  IconPath: string
  IconPathSmall: string
}

export const NW_WEAPON_TYPES: Array<NwWeaponType> = [
  // ONE HANDED
  {
    WeaponTypeID: 'Swords',
    WeaponTag: 'Sword',
    ProgressionId: 'SwordAbilityTable',
    StatsRef: 'SwordT5',
    DamageType: 'Slash',
    DamageTablePrefix: '1H_Sword_',

    UIName: 'ui_straightsword',
    MasteryName: 'ui_straightsword_mastery',
    Tree1Name: 'ui_sword',
    Tree2Name: 'ui_shield',
    GroupName: 'Swords_GroupName',
    CategoryName: 'ui_onehanded_weapons',
    IconPath: 'assets/icons/weapons/1hsword.png',
    IconPathSmall: 'assets/icons/weapons/1hswordsmall.png',
  },
  {
    WeaponTypeID: 'Rapiers',
    WeaponTag: 'Rapier',
    ProgressionId: 'RapierAbilityTable',
    StatsRef: 'RapierT5',
    DamageType: 'Thrust',
    DamageTablePrefix: '1H_Rapier_',

    UIName: 'ui_rapier',
    MasteryName: 'ui_rapier_mastery',
    Tree1Name: 'ui_blood',
    Tree2Name: 'ui_evade',
    GroupName: 'Rapiers_GroupName',
    CategoryName: 'ui_onehanded_weapons',
    IconPath: 'assets/icons/weapons/1hrapier.png',
    IconPathSmall: 'assets/icons/weapons/1hrapiersmall.png',
  },
  {
    WeaponTypeID: 'Hatchets',
    WeaponTag: 'Axe',
    ProgressionId: 'HatchetAbilityTable',
    StatsRef: 'HatchetT5',
    DamageType: 'Slash',
    DamageTablePrefix: 'Hatchet_',

    UIName: 'ui_hatchet',
    MasteryName: 'ui_hatchet_mastery',
    Tree1Name: 'ui_hatchet_tree1',
    Tree2Name: 'ui_hatchet_tree2',
    GroupName: 'Hatchets_GroupName',
    CategoryName: 'ui_onehanded_weapons',
    IconPath: 'assets/icons/weapons/1hhatchet.png',
    IconPathSmall: 'assets/icons/weapons/1hhatchetsmall.png',
  },
  {
    WeaponTypeID: 'Flail',
    WeaponTag: 'Flail',
    ProgressionId: 'FlailAbilityTable',
    StatsRef: 'FlailT5',
    DamageType: 'Strike',
    DamageTablePrefix: '1H_Flail_',

    UIName: 'ui_flail',
    MasteryName: 'ui_flail_mastery',
    Tree1Name: 'ui_flail_tree1',
    Tree2Name: 'ui_flail_tree2',
    GroupName: 'Flails_GroupName',
    CategoryName: 'ui_onehanded_weapons',
    IconPath: 'assets/icons/weapons/1hflail.png',
    IconPathSmall: 'assets/icons/weapons/1hflailsmall.png',
  },
  // TWO HANDED
  {
    WeaponTypeID: 'Spears',
    WeaponTag: 'Spear',
    ProgressionId: 'SpearAbilityTable',
    StatsRef: 'SpearT5',
    DamageType: 'Thrust',
    DamageTablePrefix: '2H_Spear_',

    UIName: 'ui_spear',
    MasteryName: 'ui_spear_mastery',
    Tree1Name: 'ui_spear_tree1',
    Tree2Name: 'ui_spear_tree2',
    GroupName: 'Spears_GroupName',
    CategoryName: 'ui_twohanded_weapons',
    IconPath: 'assets/icons/weapons/speara.png',
    IconPathSmall: 'assets/icons/weapons/spearasmall.png',
  },
  {
    WeaponTypeID: 'GreatAxe',
    WeaponTag: 'GreatAxe',
    ProgressionId: 'GreatAxeAbilityTable',
    StatsRef: '2HAxeT5',
    DamageType: 'Slash',
    DamageTablePrefix: 'GreatAxe_',

    UIName: 'ui_greataxe',
    MasteryName: 'ui_greataxe_mastery',
    Tree1Name: 'ui_greataxe_tree1',
    Tree2Name: 'ui_greataxe_tree2',
    GroupName: 'GreatAxe_GroupName',
    CategoryName: 'ui_twohanded_weapons',
    IconPath: 'assets/icons/weapons/2hgreataxe.png',
    IconPathSmall: 'assets/icons/weapons/2hgreataxesmall.png',
  },
  {
    WeaponTypeID: 'WarHammers',
    WeaponTag: 'Warhammer',
    ProgressionId: 'WarHammerAbilityTable',
    StatsRef: '2HHammerT5',
    DamageType: 'Strike',
    DamageTablePrefix: 'Warhammer_',

    UIName: 'ui_warhammer',
    MasteryName: 'ui_warhammer_mastery',
    Tree1Name: 'ui_juggernaut',
    Tree2Name: 'ui_crowdcrusher',
    GroupName: 'WarHammers_GroupName',
    CategoryName: 'ui_twohanded_weapons',
    IconPath: 'assets/icons/weapons/2hdemohammer.png',
    IconPathSmall: 'assets/icons/weapons/2hdemohammersmall.png',
  },
  {
    WeaponTypeID: 'Greatsword',
    WeaponTag: 'Greatsword',
    ProgressionId: 'GreatSwordAbilityTable',
    StatsRef: '2hGreatSwordT5',
    DamageType: 'Slash',
    DamageTablePrefix: 'GreatSword_',

    UIName: 'ui_greatsword',
    MasteryName: 'ui_greatsword_mastery',
    Tree1Name: 'ui_greatsword_tree1',
    Tree2Name: 'ui_greatsword_tree2',
    GroupName: 'Greatsword_GroupName',
    CategoryName: 'ui_twohanded_weapons',
    IconPath: 'assets/icons/weapons/2hgreatsword.png',
    IconPathSmall: 'assets/icons/weapons/2hgreatswordsmall.png',
  },

  // RANGED
  {
    WeaponTypeID: 'Muskets',
    WeaponTag: 'Rifle',
    ProgressionId: 'MusketAbilityTable',
    StatsRef: 'MusketT5',
    DamageType: 'Thrust',
    DamageTablePrefix: 'Musket',

    UIName: 'ui_musket',
    MasteryName: 'ui_musket_mastery',
    Tree1Name: 'ui_musket_tree1',
    Tree2Name: 'ui_musket_tree2',
    GroupName: 'Muskets_GroupName',
    CategoryName: 'ui_ranged_weapons',
    IconPath: 'assets/icons/weapons/2hmusketa.png',
    IconPathSmall: 'assets/icons/weapons/2hmusketasmall.png',
  },
  {
    WeaponTypeID: 'Bows',
    WeaponTag: 'Bow',
    ProgressionId: 'BowAbilityTable',
    StatsRef: 'BowT5',
    DamageType: 'Thrust',
    DamageTablePrefix: 'Bow',

    UIName: 'ui_bow',
    MasteryName: 'ui_bow_mastery',
    Tree1Name: 'ui_bow_tree1',
    Tree2Name: 'ui_bow_tree2',
    GroupName: 'Bows_GroupName',
    CategoryName: 'ui_ranged_weapons',
    IconPath: 'assets/icons/weapons/bowb.png',
    IconPathSmall: 'assets/icons/weapons/bowbsmall.png',
  },
  {
    WeaponTypeID: 'Blunderbuss',
    WeaponTag: 'Blunderbuss',
    ProgressionId: 'BlunderbussAbilityTable',
    StatsRef: 'BlunderbussT5',
    DamageType: 'Thrust',
    DamageTablePrefix: 'Blunderbuss_',

    UIName: 'ui_blunderbuss',
    MasteryName: 'ui_blunderbuss_mastery',
    Tree1Name: 'ui_blunderbuss_tree1',
    Tree2Name: 'ui_blunderbuss_tree2',
    GroupName: 'Blunderbuss_GroupName',
    CategoryName: 'ui_ranged_weapons',
    IconPath: 'assets/icons/weapons/blunderbuss.png',
    IconPathSmall: 'assets/icons/weapons/blunderbusssmall.png',
  },

  // MAGIC
  {
    WeaponTypeID: 'StavesFire',
    WeaponTag: 'Fire',
    ProgressionId: 'FireMagicAbilityTable',
    StatsRef: 'FireStaffT5',
    DamageType: 'Fire',
    DamageTablePrefix: 'Firestaff_',

    UIName: 'ui_firestaff',
    MasteryName: 'ui_firemagic_mastery',
    Tree1Name: 'ui_firestaff_tree1',
    Tree2Name: 'ui_firestaff_tree2',
    GroupName: 'StavesFire_GroupName',
    CategoryName: 'ui_magic_skills',
    IconPath: 'assets/icons/weapons/stafffire.png',
    IconPathSmall: 'assets/icons/weapons/stafffiresmall.png',
  },
  {
    WeaponTypeID: 'StavesLife',
    WeaponTag: 'Heal',
    ProgressionId: 'LifeMagicAbilityTable',
    StatsRef: 'LifeStaffT5',
    DamageType: 'Nature',
    DamageTablePrefix: 'LifeStaff_',

    UIName: 'ui_lifestaff',
    MasteryName: 'ui_lifemagic_mastery',
    Tree1Name: 'ui_lifestaff_tree1',
    Tree2Name: 'ui_lifestaff_tree2',
    GroupName: 'StavesLife_GroupName',
    CategoryName: 'ui_magic_skills',
    IconPath: 'assets/icons/weapons/stafflife.png',
    IconPathSmall: 'assets/icons/weapons/stafflifesmall.png',
  },
  {
    WeaponTypeID: 'GauntletIce',
    WeaponTag: 'Ice',
    ProgressionId: 'IceMagicAbilityTable',
    StatsRef: '1hElementalGauntlet_IceT5',
    DamageType: 'Ice',
    DamageTablePrefix: 'IceMagic_',

    UIName: 'ui_icemagic',
    MasteryName: 'ui_icemagic_mastery',
    Tree1Name: 'ui_icemagic_tree1',
    Tree2Name: 'ui_icemagic_tree2',
    GroupName: 'GauntletIce_GroupName',
    CategoryName: 'ui_magic_skills',
    IconPath: 'assets/icons/weapons/icegauntlet.png',
    IconPathSmall: 'assets/icons/weapons/icegauntletsmall.png',
  },
  {
    WeaponTypeID: 'GauntletVoid',
    WeaponTag: 'VoidGauntlet',
    ProgressionId: 'VoidGauntletAbilityTable',
    StatsRef: 'VoidGauntletT5',
    DamageType: 'Corruption',
    DamageTablePrefix: 'VoidGauntlet_',

    UIName: 'ui_voidmagic',
    MasteryName: 'ui_voidmagic_mastery',
    Tree1Name: 'ui_voidmagic_tree1',
    Tree2Name: 'ui_voidmagic_tree2',
    GroupName: 'GauntletVoid_GroupName',
    CategoryName: 'ui_magic_skills',
    IconPath: 'assets/icons/weapons/voidgauntlet.png',
    IconPathSmall: 'assets/icons/weapons/voidgauntletsmall.png',
  },
  // Add new weapon types here
  // {
  //   WeaponTypeID:      -> preferably use same as `WeapoTag`
  //   WeaponTag:         -> should be given from generated types
  //   ProgressionId:     -> should be given from generated types. It likely is 'WEAPONTAGT5',
  //   StatsRef:          -> lookup what new weapons are linked to. It likely is 'WEAPONTAGT5',
  //   DamageType:        -> should be given from generated types
  //   DamageTablePrefix: -> lookup damagetables and work out the prefix. It likely is 'WAPONTAG_',

  //   UIName: 'ui_voidmagic',
  //   MasteryName: 'ui_voidmagic_mastery',
  //   Tree1Name: 'ui_voidmagic_tree1',
  //   Tree2Name: 'ui_voidmagic_tree2',
  //   GroupName: 'GauntletVoid_GroupName',
  //   CategoryName: 'ui_magic_skills',
  //   IconPath: 'assets/icons/weapons/voidgauntlet.png',
  //   IconPathSmall: 'assets/icons/weapons/voidgauntletsmall.png',
  // },
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

export function getWeaponTypeInfo(weaponTag: string) {
  return NW_WEAPON_TYPES.find((it) => eqCaseInsensitive(it.WeaponTag, weaponTag))
}

export function getWeaponTypes() {
  return NW_WEAPON_TYPES
}
