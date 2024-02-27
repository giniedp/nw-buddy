import type { calculateDamage } from '../damage'

export default {
  input: {
    attackerLevel: 11,
    attackerGearScore: 32,
    attackerIsPlayer: true,
    attributes: {
      str: 34.125, // 26 attribute points
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
    modBase: 0.25, // 20% light, 5% from 25str
    modBaseConvert: 0.2,
    modCrit: 0.3,
    modEmpower: 0,
    modEmpowerConvert: 0,

    armorPenetration: 0,
    defenderLevel: 61,
    defenderGearScore: 611,
    defenderIsPlayer: true,
    defenderRatingWeapon: 2075,
    defenderRatingConvert: 1887,
    defenderABSWeapon: 0.081, // 5x0.62 spectral gem
    defenderABSConvert: 0,
    defenderWKNWeapon: 0,
    defenderWKNConvert: 0,
  },
  output: {
    weapon: {
      std: 263,
      stdMitigated: 90,
      stdFinal: 173,
      crit: 0,
      critMitigated: 0,
      critFinal: 0,
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
      std: 263,
      stdMitigated: 90,
      stdFinal: 173,
      crit: 0,
      critMitigated: 0,
      critFinal: 0,
    }
  }
} satisfies {
  input: Parameters<typeof calculateDamage>[0],
  output: ReturnType<typeof calculateDamage>,
}
