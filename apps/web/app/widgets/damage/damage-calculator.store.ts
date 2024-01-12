import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { AttributeRef, NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'

export interface DamageCalculatorState {
  playerLevel: number
  attrSums: Record<AttributeRef, number>

  baseDamage: number
  critDamage: number
  weaponGearScore: number
  weaponScale: Record<AttributeRef, number>

  damageCoefficient: number
  ammoModifier: number

  baseDamageMods: number
  critMods: number
  empowerMods: number

  armorPenetration: number
  attackerAvgGs: number
  defenderAvgGs: number
  defenderArmorRating: number
}

export const DamageCalculatorStore = signalStore(
  withState({
    playerLevel: NW_MAX_CHARACTER_LEVEL,
    baseDamage: 0,
    critDamage: 0,

    damageCoefficient: 0,
    ammoModifier: 0,
    baseDamageMods: 0,
    critMods: 0,
    empowerMods: 0,

    weaponGearScore: NW_MAX_GEAR_SCORE,
    weaponScale: 0,
    attrScale: 0,

    attackerAvgGs: 0,
    defenderAvgGs: 0,
    armorPenetration: 0,
    defenderArmorRating: 0,
  }),
  withComputed(() => {
    return {}
  }),
  withMethods((store) => {
    return {
      setFromAttirbutes: (attrs: Record<AttributeRef, number>) => {
        patchState(store, {

        })
      }
    }
  })
)
