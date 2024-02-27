import type { calculateDamage } from '../damage'

export default {
  input: {
    attackerLevel: 11,
    attackerGearScore: 32,
    attackerIsPlayer: true,
    attributes: {
      str: 34.125,
      dex: 0,
      int: 0,
      foc: 0,
      con: 0,
    },

    preferHigherScaling: true,
    convertPercent: 0,
    convertScaling: {
      str: 0,
      dex: 0,
      int: 0,
      foc: 0,
      con: 0,
    },

    weaponScaling: {
      str: 0.009,
      dex: 0.0065,
      int: 0,
      foc: 0,
      con: 0,
    },
    weaponGearScore: 100,
    baseDamage: 64,
    damageCoef: 1,

    modPvp: 0,
    modAmmo: 0,
    modBase: 0.25,
    modBaseConvert: 0.2,
    modCrit: 0.3,
    modEmpower: 0,
    modEmpowerConvert: 0,

    armorPenetration: 0,
    defenderLevel: 61,
    defenderGearScore: 109,
    defenderIsPlayer: true,
    defenderRatingWeapon: 0,
    defenderRatingConvert: 0,
    defenderABSWeapon: 0,
    defenderABSConvert: 0,
    defenderWKNWeapon: 0,
    defenderWKNConvert: 0,
  },
  output: {
    weapon: {
      std: 264,
      stdMitigated: 0,
      stdFinal: 264,
      crit: 328,
      critMitigated: 0,
      critFinal: 328,
    },
    affix: {
      std: 0,
      stdFinal: 0,
      stdMitigated: 0,
      crit: 0,
      critFinal: 0,
      critMitigated: 0,
    },
    total: {
      std: 264,
      stdMitigated: 0,
      stdFinal: 264,
      crit: 320,
      critMitigated: 0,
      critFinal: 320,
    }
  }
} satisfies {
  input: Parameters<typeof calculateDamage>[0],
  output: ReturnType<typeof calculateDamage>,
}
