import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  AttributeRef,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE,
  armorRating,
  calculateDamage,
  getVitalGearScoreFromLevel,
  isDamageTypeElemental,
} from '@nw-data/common'
import { Vitals } from '@nw-data/generated'
import { pipe, switchMap, tap } from 'rxjs'
import { NwDataService } from '~/data'
import { damageTypeIcon } from '~/nw/weapon-types'

export interface DamageCalculatorState {
  attackerLevel: number
  attackerLevelTweak: number

  attackerGearScore: number
  attackerGearScoreTweak: number

  attributes: Record<AttributeRef, number>

  preferHigherScaling: boolean
  convertPercent: number
  convertScaling: Record<AttributeRef, number>
  convertDamageType: string

  weaponGearScore: number
  weaponGearScoreTweak: number

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

  defenderCreature: Vitals
  defenderIsPlayer: boolean
  defenderLevel: number
  defenderLevelTweak: number
  defenderGearScore: number
  defenderGearScoreTweak: number

  defenderArmorPhys: number
  defenderArmorPhysTweak: number
  defenderArmorElem: number
  defenderArmorElemTweak: number
  defenderArmorPhysFort: number
  defenderArmorPhysFortTweak: number
  defenderArmorElemFort: number
  defenderArmorElemFortTweak: number
  defenderArmorPhysAdd: number
  defenderArmorPhysAddTweak: number
  defenderArmorElemAdd: number
  defenderArmorElemAddTweak: number

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
    attackerLevelTweak: 0,

    attackerGearScore: NW_MAX_GEAR_SCORE,
    attackerGearScoreTweak: 0,
    attributes: {
      str: 0,
      dex: 0,
      int: 0,
      foc: 0,
      con: 0,
    },

    weaponGearScore: NW_MAX_GEAR_SCORE,
    weaponGearScoreTweak: 0,
    weaponDamageType: '',
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

    defenderCreature: null,
    defenderIsPlayer: false,
    defenderLevel: 0,
    defenderLevelTweak: 0,

    defenderGearScore: 0,
    defenderGearScoreTweak: 0,

    defenderArmorPhys: 0,
    defenderArmorPhysTweak: 0,

    defenderArmorElem: 0,
    defenderArmorElemTweak: 0,

    defenderArmorPhysFort: 0,
    defenderArmorPhysFortTweak: 0,

    defenderArmorElemFort: 0,
    defenderArmorElemFortTweak: 0,

    defenderArmorPhysAdd: 0,
    defenderArmorPhysAddTweak: 0,

    defenderArmorElemAdd: 0,
    defenderArmorElemAddTweak: 0,

    defenderABSWeapon: 0,
    defenderABSWeaponTweak: 0,

    defenderABSConverted: 0,
    defenderABSConvertedTweak: 0,

    defenderWKNWeapon: 0,
    defenderWKNWeaponTweak: 0,
    defenderWKNConverted: 0,
    defenderWKNConvertedTweak: 0,
  }),
  withMethods((store, db = inject(NwDataService)) => {
    return {
      setVitalDefender: (vital: Vitals) => {
        patchState(store, {
          defenderIsPlayer: false,
          defenderCreature: vital,
          defenderArmorElem: 0,
          defenderArmorElemAdd: 0,
          defenderArmorElemFort: 0,
          defenderArmorPhys: 0,
          defenderArmorPhysAdd: 0,
          defenderArmorPhysFort: 0,
        })
      },
    }
  }),
  withComputed(
    ({
      weaponDamageType,
      convertDamageType,
      defenderCreature,
      defenderIsPlayer,
      defenderGearScore,
      defenderLevel,
      defenderLevelTweak,
      defenderArmorElem,
      defenderArmorPhys,
      defenderABSWeapon,
      defenderABSConverted,
      defenderWKNWeapon,
      defenderWKNConverted,
    }) => {
      const isPvE = computed(() => {
        return !defenderIsPlayer() && !!defenderCreature()
      })
      const vitalLevel = computed(() => {
        return defenderCreature()?.Level || 0
      })
      const vitalGearScore = computed(() => {
        return getVitalGearScoreFromLevel(vitalLevel() + defenderLevelTweak())
      })
      return {
        defenderLevel: computed(() => {
          if (!isPvE()) {
            return defenderLevel()
          }
          return vitalLevel()
        }),
        defenderGearScore: computed(() => {
          if (!isPvE()) {
            return defenderGearScore()
          }
          return vitalGearScore()
        }),
        defenderArmorPhys: computed(() => {
          if (!isPvE()) {
            return defenderArmorPhys()
          }
          return armorRating({
            gearScore: vitalGearScore(),
            mitigation: defenderCreature().PhysicalMitigation,
          })
        }),
        defenderArmorElem: computed(() => {
          if (!isPvE()) {
            return defenderArmorElem()
          }
          return armorRating({
            gearScore: vitalGearScore(),
            mitigation: defenderCreature().ElementalMitigation,
          })
        }),
        defenderABSWeapon: computed(() => {
          if (!isPvE()) {
            return defenderABSWeapon()
          }
          return defenderCreature()[`ABS${weaponDamageType()}`] || 0
        }),
        defenderABSConverted: computed(() => {
          if (!isPvE()) {
            return defenderABSConverted()
          }
          return defenderCreature()[`ABS${convertDamageType()}`] || 0
        }),
        defenderWKNWeapon: computed(() => {
          if (!isPvE()) {
            return defenderWKNWeapon()
          }
          return defenderCreature()[`WKN${weaponDamageType()}`] || 0
        }),
        defenderWKNConverted: computed(() => {
          if (!isPvE()) {
            return defenderWKNConverted()
          }
          return defenderCreature()[`WKN${convertDamageType()}`] || 0
        }),
      }
    },
  ),
  withComputed((store) => {
    return {
      attackerLevelSum: computed(() => store.attackerLevel() + store.attackerLevelTweak()),
      attackerGearScoreSum: computed(() => store.attackerGearScore() + store.attackerGearScoreTweak()),
      weaponGearScoreSum: computed(() => store.weaponGearScore() + store.weaponGearScoreTweak()),
      armorPenetrationSum: computed(() => store.armorPenetration() + store.armorPenetrationTweak()),

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
      defenderArmorPhysSum: computed(() => store.defenderArmorPhys() + store.defenderArmorPhysTweak()),
      defenderArmorElemSum: computed(() => store.defenderArmorElem() + store.defenderArmorElemTweak()),
      defenderArmorPhysFortSum: computed(() => store.defenderArmorPhysFort() + store.defenderArmorPhysFortTweak()),
      defenderArmorElemFortSum: computed(() => store.defenderArmorElemFort() + store.defenderArmorElemFortTweak()),
      defenderArmorPhysAddSum: computed(() => store.defenderArmorPhysAdd() + store.defenderArmorPhysAddTweak()),
      defenderArmorElemAddSum: computed(() => store.defenderArmorElemAdd() + store.defenderArmorElemAddTweak()),
      defenderABSWeaponSum: computed(() => store.defenderABSWeapon() + store.defenderABSWeaponTweak()),
      defenderABSConvertedSum: computed(() => store.defenderABSConverted() + store.defenderABSConvertedTweak()),
      defenderWKNWeaponSum: computed(() => store.defenderWKNWeapon() + store.defenderWKNWeaponTweak()),
      defenderWKNConvertedSum: computed(() => store.defenderWKNConverted() + store.defenderWKNConvertedTweak()),
    }
  }),
  withComputed((store) => {
    const defenderArmorRatingElem = computed(() => {
      return store.defenderArmorElemSum() * (1 + store.defenderArmorElemFortSum()) + store.defenderArmorElemAddSum()
    })
    const defenderArmorRatingPhys = computed(() => {
      return store.defenderArmorPhysSum() * (1 + store.defenderArmorPhysFortSum()) + store.defenderArmorPhysAddSum()
    })
    return {
      defenderArmorRatingElem,
      defenderArmorRatingPhys,
      defenderArmorWeapon: computed(() => {
        if (store.weaponIsElemental()) {
          return defenderArmorRatingElem()
        }
        return defenderArmorRatingPhys()
      }),
      defenderArmorConverted: computed(() => {
        if (store.weaponIsElemental()) {
          return defenderArmorRatingElem()
        }
        return defenderArmorRatingPhys()
      }),
    }
  }),
  withComputed((store) => {
    return {
      output: computed(() => {
        return calculateDamage({
          attackerIsPlayer: true,
          attackerLevel: store.attackerLevelSum(),
          attackerGearScore: store.attackerGearScoreSum(),
          attributes: store.attributes(),

          preferHigherScaling: store.preferHigherScaling(),
          convertPercent: store.convertPercent(),
          convertScaling: store.convertScaling(),

          weaponScaling: store.weaponScaling(),
          weaponGearScore: store.weaponGearScoreSum(),
          baseDamage: store.baseDamageSum(),
          damageCoef: store.damageCoefSum(),

          modPvp: store.pvpModsSum(),
          modAmmo: store.ammoModsSum(),
          modBase: store.baseModsSum(),
          modBaseConvert: store.convertBaseModsSum(),
          modCrit: store.critModsSum(),
          modEmpower: store.empowerModsSum(),
          modEmpowerConvert: store.convertEmpowerModsSum(),

          armorPenetration: store.armorPenetrationSum(),
          defenderLevel: store.defenderLevelSum(),
          defenderGearScore: store.defenderGearScoreSum(),
          defenderIsPlayer: store.defenderIsPlayer(),
          defenderRatingWeapon: store.defenderArmorWeapon(),
          defenderRatingConvert: store.defenderArmorConverted(),
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
      tweakAttackerLevel: (value: number) => patchState(store, { attackerLevelTweak: value }),
      tweakAttackerGearScore: (value: number) => patchState(store, { attackerGearScoreTweak: value }),
      tweakWeaponGearScore: (value: number) => patchState(store, { weaponGearScoreTweak: value }),
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
      tweakDefenderArmorPhys: (value: number) => patchState(store, { defenderArmorPhysTweak: value }),
      tweakDefenderArmorElem: (value: number) => patchState(store, { defenderArmorElemTweak: value }),
      tweakDefenderArmorPhysFort: (value: number) => patchState(store, { defenderArmorPhysFortTweak: value }),
      tweakDefenderArmorElemFort: (value: number) => patchState(store, { defenderArmorElemFortTweak: value }),
      tweakDefenderArmorPhysAdd: (value: number) => patchState(store, { defenderArmorPhysAddTweak: value }),
      tweakDefenderArmorElemAdd: (value: number) => patchState(store, { defenderArmorElemAddTweak: value }),
      tweakDefenderABSWeapon: (value: number) => patchState(store, { defenderABSWeaponTweak: value }),
      tweakDefenderABSConverted: (value: number) => patchState(store, { defenderABSConvertedTweak: value }),
      tweakDefenderWKNWeapon: (value: number) => patchState(store, { defenderWKNWeaponTweak: value }),
      tweakDefenderWKNConverted: (value: number) => patchState(store, { defenderWKNConvertedTweak: value }),
    }
  }),

)
