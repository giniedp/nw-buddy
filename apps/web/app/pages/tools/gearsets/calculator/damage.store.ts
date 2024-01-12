import { computed } from "@angular/core"
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals"
import { AttributeRef, NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE, damageFactorForAttrs, damageForWeapon, damageMitigationPercent, pvpGearScore } from "@nw-data/common"
import { damageTypeIcon } from "~/nw/weapon-types"

export interface DamageCalculatorState {
  playerLevel: number
  playerGearScore: number,
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

  defenderGearScore: number
  defenderGearScoreTweak: number
  defenderRatingPhys: number,
  defenderRatingPhysTweak: number,
  defenderRatingElem: number,
  defenderRatingElemTweak: number,
  defenderAbsorbWeapon: number,
  defenderAbsorbWeaponTweak: number,
  defenderAbsorbConverted: number,
  defenderAbsorbConvertedTweak: number,
}

export const DamageCalculatorStore = signalStore(
  withState<DamageCalculatorState>({
    playerLevel: NW_MAX_CHARACTER_LEVEL,
    playerGearScore: NW_MAX_GEAR_SCORE,
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

    defenderGearScore: 0,
    defenderGearScoreTweak: 0,

    defenderRatingPhys: 0,
    defenderRatingPhysTweak: 0,

    defenderRatingElem: 0,
    defenderRatingElemTweak: 0,

    defenderAbsorbWeapon: 0,
    defenderAbsorbWeaponTweak: 0,

    defenderAbsorbConverted: 0,
    defenderAbsorbConvertedTweak: 0,
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

      defenderGearScoreSum: computed(() => store.defenderGearScore() + store.defenderGearScoreTweak()),
      defenderRatingPhysSum: computed(() => store.defenderRatingPhys() + store.defenderRatingPhysTweak()),
      defenderRatingElemSum: computed(() => store.defenderRatingElem() + store.defenderRatingElemTweak()),
      defenderAbsorbWeaponSum: computed(() => store.defenderAbsorbWeapon() + store.defenderAbsorbWeaponTweak()),
      defenderAbsorbConvertedSum: computed(() => store.defenderAbsorbConverted() + store.defenderAbsorbConvertedTweak()),
    }
  }),
  withComputed((store) => {
    const output = computed(() => {
      const attributes = store.attributes()

      const convertPercent = store.convertPercent() ?? 0
      const convertScale = damageFactorForAttrs({
        weapon: store.convertScaling(),
        attributes: store.attributes(),
      })

      const weaponPercent = 1 - convertPercent
      const weaponScale = damageFactorForAttrs({
        weapon: store.weaponScaling(),
        attributes: store.attributes(),
      })

      let convertScaling = store.convertScaling()
      let weaponScaling = store.weaponScaling()
      if (store.preferHigherScaling) {
        if (weaponScale > convertScale) {
          convertScaling = weaponScaling
        } else {
          weaponScaling = convertScaling
        }
      }

      const inputs = {
        playerLevel: store.playerLevel(),
        baseDamage: store.baseDamageSum(),
        weaponGearScore: store.weaponGearScore(),
        weaponScale: weaponScaling,
        attributes: attributes,
        damageCoef: store.damageCoefSum(),
        pvpMod: store.pvpModsSum(),
        ammoMod: store.ammoModsSum(),
        baseMod: store.baseModsSum(),
        critMod: store.critModsSum(),
        empowerMod: store.empowerModsSum(),
      } satisfies Parameters<typeof damageForWeapon>[0]

      const weaponDamage = weaponPercent * damageForWeapon({
        ...inputs,
        weaponScale: weaponScaling,
        critMod: 0,
      })
      const weaponDamageCrit = weaponPercent * damageForWeapon({
        ...inputs,
        weaponScale: weaponScaling,
      })
      const weaponMitigated = damageMitigationPercent({
        armorPenetration: store.armorPenetration(),
        armorRating: store.defenderRatingPhysSum(),
        gearScore: pvpGearScore({
          attackerAvgGearScore: store.playerGearScore(),
          defenderAvgGearScore: store.defenderGearScore(),
          weaponGearScore: store.weaponGearScore(),
        }),
      })

      const convertedDamage = convertPercent * damageForWeapon({
        ...inputs,
        weaponScale: convertScaling,
        critMod: 0,
        baseMod: store.convertBaseModsSum(),
        empowerMod: store.convertEmpowerModsSum(),
      })
      const convertedDamageCrit = convertPercent * damageForWeapon({
        ...inputs,
        weaponScale: convertScaling,
        baseMod: store.convertBaseModsSum(),
        empowerMod: store.convertEmpowerModsSum(),
      })
      const convertedMitigated = damageMitigationPercent({
        armorPenetration: store.armorPenetration(),
        armorRating: store.defenderRatingElemSum(),
        gearScore: pvpGearScore({
          attackerAvgGearScore: store.playerGearScore(),
          defenderAvgGearScore: store.defenderGearScore(),
          weaponGearScore: store.weaponGearScore(),
        }),
      })

      const weapon = {
        std: weaponDamage,
        stdMitigated: weaponDamage * weaponMitigated,
        stdFinal: weaponDamage * (1 - weaponMitigated),

        crit: weaponDamageCrit,
        critMitigated: weaponDamageCrit * weaponMitigated,
        critFinal: weaponDamageCrit * (1 - weaponMitigated),
      }
      const converted = {
        std: convertedDamage,
        stdMitigated: convertedDamage * convertedMitigated,
        stdFinal: convertedDamage * (1 - convertedMitigated),

        crit: convertedDamageCrit,
        critMitigated: convertedDamageCrit * convertedMitigated,
        critFinal: convertedDamageCrit * (1 - convertedMitigated),
      }
      const total = {
        std: weapon.std + converted.std,
        stdMitigated: weapon.stdMitigated + converted.stdMitigated,
        stdFinal: weapon.stdFinal + converted.stdFinal,

        crit: weapon.crit + converted.crit,
        critMitigated: weapon.critMitigated + converted.critMitigated,
        critFinal: weapon.critFinal + converted.critFinal,
      }
      return {
        weapon,
        converted,
        total,
      }
    })

    return {
      output: output
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
      tweakDefenderGearScore: (value: number) => patchState(store, { defenderGearScoreTweak: value }),
      tweakDefenderRatingPhys: (value: number) => patchState(store, { defenderRatingPhysTweak: value }),
      tweakDefenderRatingElem: (value: number) => patchState(store, { defenderRatingElemTweak: value }),
      tweakDefenderAbsorbWeapon: (value: number) => patchState(store, { defenderAbsorbWeaponTweak: value }),
      tweakDefenderAbsorbConverted: (value: number) => patchState(store, { defenderAbsorbConvertedTweak: value }),
    }
  })
)
