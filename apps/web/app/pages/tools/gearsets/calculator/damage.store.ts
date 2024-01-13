import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { AttributeRef, NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE, calculateDamage, getDamageTypesOfCategory, isDamageTypeElemental } from '@nw-data/common'
import { damageTypeIcon } from '~/nw/weapon-types'

export interface DamageCalculatorState {
  attackerLevel: number
  attackerGearScore: number
  attributes: Record<AttributeRef, number>

  preferHigherScaling: boolean
  convertPercent: number
  convertScaling: Record<AttributeRef, number>
  convertDamageType: string

  weaponGearScore: number
  weaponScaling: Record<AttributeRef, number>
  weaponDamageType: string

  baseDamage: number
  baseDamageTweak: number

  damageCoef: number
  damageCoefTweak: number

  pvpMods: number
  pvpModsTweak: number

  baseMods: number
  baseModsTweak: number

  critMods: number
  critModsTweak: number

  empowerMods: number
  empowerModsTweak: number

  convertBaseMods: number
  convertBaseModsTweak: number

  convertEmpowerMods: number
  convertEmpowerModsTweak: number

  ammoMods: number
  ammoModsTweak: number

  armorPenetration: number
  armorPenetrationTweak: number

  defenderIsPlayer: boolean
  defenderLevel: number
  defenderLevelTweak: number
  defenderGearScore: number
  defenderGearScoreTweak: number
  defenderRatingPhys: number
  defenderRatingPhysTweak: number
  defenderRatingElem: number
  defenderRatingElemTweak: number
  defenderABSWeapon: number
  defenderABSWeaponTweak: number
  defenderABSConverted: number
  defenderABSConvertedTweak: number
  defenderWKNWeapon: number
  defenderWKNWeaponTweak: number
  defenderWKNConverted: number
  defenderWKNConvertedTweak: number
}

export const DamageCalculatorStore = signalStore(
  withState<DamageCalculatorState>({
    attackerLevel: NW_MAX_CHARACTER_LEVEL,
    attackerGearScore: NW_MAX_GEAR_SCORE,
    attributes: {
      str: 5,
      dex: 5,
      int: 5,
      foc: 5,
      con: 5,
    },

    weaponDamageType: '',
    weaponGearScore: NW_MAX_GEAR_SCORE,
    weaponScaling: {
      str: 0,
      dex: 0,
      int: 0,
      foc: 0,
      con: 0,
    },

    preferHigherScaling: true,
    convertPercent: 0,
    convertDamageType: '',
    convertScaling: {
      str: 0,
      dex: 0,
      int: 0,
      foc: 0,
      con: 0,
    },

    baseDamage: 0,
    baseDamageTweak: 0,

    damageCoef: 0,
    damageCoefTweak: 0,

    pvpMods: 0,
    pvpModsTweak: 0,

    baseMods: 0,
    baseModsTweak: 0,

    critMods: 0,
    critModsTweak: 0,

    empowerMods: 0,
    empowerModsTweak: 0,

    convertBaseMods: 0,
    convertBaseModsTweak: 0,

    convertEmpowerMods: 0,
    convertEmpowerModsTweak: 0,

    ammoMods: 0,
    ammoModsTweak: 0,

    armorPenetration: 0,
    armorPenetrationTweak: 0,

    defenderIsPlayer: false,
    defenderLevel: 0,
    defenderLevelTweak: 0,

    defenderGearScore: 0,
    defenderGearScoreTweak: 0,

    defenderRatingPhys: 0,
    defenderRatingPhysTweak: 0,

    defenderRatingElem: 0,
    defenderRatingElemTweak: 0,

    defenderABSWeapon: 0,
    defenderABSWeaponTweak: 0,

    defenderABSConverted: 0,
    defenderABSConvertedTweak: 0,

    defenderWKNWeapon: 0,
    defenderWKNWeaponTweak: 0,
    defenderWKNConverted: 0,
    defenderWKNConvertedTweak: 0,
  }),
  withComputed((store) => {
    return {
      baseDamageSum: computed(() => store.baseDamage() + store.baseDamageTweak()),
      damageCoefSum: computed(() => store.damageCoef() + store.damageCoefTweak()),
      baseModsSum: computed(() => store.baseMods() + store.baseModsTweak()),
      critModsSum: computed(() => store.critMods() + store.critModsTweak()),
      empowerModsSum: computed(() => store.empowerMods() + store.empowerModsTweak()),
      convertBaseModsSum: computed(() => store.convertBaseMods() + store.convertBaseModsTweak()),
      convertEmpowerModsSum: computed(() => store.convertEmpowerMods() + store.convertEmpowerModsTweak()),
      pvpModsSum: computed(() => store.pvpMods() + store.pvpModsTweak()),
      ammoModsSum: computed(() => store.ammoMods() + store.ammoModsTweak()),

      weaponTypeIcon: computed(() => damageTypeIcon(store.weaponDamageType())),
      convertTypeIcon: computed(() => damageTypeIcon(store.convertDamageType())),
      weaponIsElemental: computed(() => isDamageTypeElemental(store.weaponDamageType())),
      convertIsElemental: computed(() => isDamageTypeElemental(store.convertDamageType())),

      defenderLevelSum: computed(() => store.defenderLevel() + store.defenderLevelTweak()),
      defenderGearScoreSum: computed(() => store.defenderGearScore() + store.defenderGearScoreTweak()),
      defenderRatingPhysSum: computed(() => store.defenderRatingPhys() + store.defenderRatingPhysTweak()),
      defenderRatingElemSum: computed(() => store.defenderRatingElem() + store.defenderRatingElemTweak()),
      defenderABSWeaponSum: computed(() => store.defenderABSWeapon() + store.defenderABSWeaponTweak()),
      defenderABSConvertedSum: computed(() => store.defenderABSConverted() + store.defenderABSConvertedTweak()),
      defenderWKNWeaponSum: computed(() => store.defenderWKNWeapon() + store.defenderWKNWeaponTweak()),
      defenderWKNConvertedSum: computed(() => store.defenderWKNConverted() + store.defenderWKNConvertedTweak()),
    }
  }),
  withComputed((store) => {
    return {
      defenderRatingWeapon: computed(() => {
        return store.weaponIsElemental() ? store.defenderRatingElemSum() : store.defenderRatingPhysSum()
      }),
      defenderRatingConverted: computed(() => {
        return store.convertIsElemental() ? store.defenderRatingElemSum() : store.defenderRatingPhysSum()
      })
    }
  }),
  withComputed((store) => {
    return {
      output: computed(() => {
        return calculateDamage({
          attackerLevel: store.attackerLevel(),
          attackerGearScore: store.attackerGearScore(),
          attackerIsPlayer: true,
          attributes: store.attributes(),

          preferHigherScaling: store.preferHigherScaling(),
          convertPercent: store.convertPercent(),
          convertScaling: store.convertScaling(),

          weaponScaling: store.weaponScaling(),
          weaponGearScore: store.weaponGearScore(),
          baseDamage: store.baseDamageSum(),
          damageCoef: store.damageCoefSum(),

          modPvp: store.pvpModsSum(),
          modAmmo: store.ammoModsSum(),
          modBase: store.baseModsSum(),
          modBaseConvert: store.convertBaseModsSum(),
          modCrit: store.critModsSum(),
          modEmpower: store.empowerModsSum(),
          modEmpowerConvert: store.convertEmpowerModsSum(),

          armorPenetration: store.armorPenetration(),
          defenderLevel: store.defenderLevelSum(),
          defenderGearScore: store.defenderGearScoreSum(),
          defenderIsPlayer: store.defenderIsPlayer(),
          defenderRatingWeapon: store.defenderRatingWeapon(),
          defenderRatingConvert: store.defenderRatingConverted(),
          defenderABSWeapon: store.defenderABSWeaponSum(),
          defenderABSConvert: store.defenderABSConvertedSum(),
          defenderWKNWeapon: store.defenderWKNWeaponSum(),
          defenderWKNConvert: store.defenderWKNConvertedSum(),
        })
      }),
    }
  }),
  withMethods((store) => {
    return {
      tweakBaseDamage: (value: number) => patchState(store, { baseDamageTweak: value }),
      tweakDamageCoef: (value: number) => patchState(store, { damageCoefTweak: value }),
      tweakPvpMods: (value: number) => patchState(store, { pvpModsTweak: value }),
      tweakBaseMods: (value: number) => patchState(store, { baseModsTweak: value }),
      tweakCritMods: (value: number) => patchState(store, { critModsTweak: value }),
      tweakEmpowerMods: (value: number) => patchState(store, { empowerModsTweak: value }),
      tweakConvertBaseMods: (value: number) => patchState(store, { convertBaseModsTweak: value }),
      tweakConvertEmpowerMods: (value: number) => patchState(store, { convertEmpowerModsTweak: value }),
      tweakAmmoMods: (value: number) => patchState(store, { ammoModsTweak: value }),
      tweakArmorPenetration: (value: number) => patchState(store, { armorPenetrationTweak: value }),
      tweakDefenderIsPlayer: (value: boolean) => patchState(store, { defenderIsPlayer: value }),
      tweakDefenderLevel: (value: number) => patchState(store, { defenderLevelTweak: value }),
      tweakDefenderGearScore: (value: number) => patchState(store, { defenderGearScoreTweak: value }),
      tweakDefenderRatingPhys: (value: number) => patchState(store, { defenderRatingPhysTweak: value }),
      tweakDefenderRatingElem: (value: number) => patchState(store, { defenderRatingElemTweak: value }),
      tweakDefenderABSWeapon: (value: number) => patchState(store, { defenderABSWeaponTweak: value }),
      tweakDefenderABSConverted: (value: number) => patchState(store, { defenderABSConvertedTweak: value }),
      tweakDefenderWKNWeapon: (value: number) => patchState(store, { defenderWKNWeaponTweak: value }),
      tweakDefenderWKNConverted: (value: number) => patchState(store, { defenderWKNConvertedTweak: value }),
    }
  }),
)
