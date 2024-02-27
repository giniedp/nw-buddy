import type { calculateDamage } from '../damage'

export default {
  input: {
    attackerLevel: 61,
    attackerGearScore: 109,
    attackerIsPlayer: true,
    attributes: {
      str: 91,
      dex: 146.25, // 95 points
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
    weaponGearScore: 625,
    baseDamage: 64,
    damageCoef: 1,

    modPvp: 0,
    modAmmo: 0,
    modBase: 0.3,
    modBaseConvert: 0.2,
    modCrit: 0.3,
    modEmpower: 0,
    modEmpowerConvert: 0,

    armorPenetration: 0,
    defenderLevel: 11,
    defenderGearScore: 32,
    defenderIsPlayer: true,
    defenderRatingWeapon: 17,
    defenderRatingConvert: 17,
    defenderABSWeapon: 0,
    defenderABSConvert: 0,
    defenderWKNWeapon: 0,
    defenderWKNConvert: 0,
  },
  output: {
    weapon: {
      std: 260,
      stdMitigated: 2,
      stdFinal: 258,
      crit: 320,
      critMitigated: 2,
      critFinal: 318,
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
      std: 260,
      stdMitigated: 2,
      stdFinal: 258,
      crit: 320,
      critMitigated: 2,
      critFinal: 318,
    }
  }
} satisfies {
  input: Parameters<typeof calculateDamage>[0],
  output: ReturnType<typeof calculateDamage>,
}
