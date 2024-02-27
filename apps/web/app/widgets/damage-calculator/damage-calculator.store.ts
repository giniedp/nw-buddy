import { Injector, computed, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  AttributeRef,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE,
  NW_MAX_POINTS_PER_ATTRIBUTE,
  NW_MIN_POINTS_PER_ATTRIBUTE,
  calculateDamage,
  getDamageFactorForGearScore,
  getDamageScalingForLevel,
  getDamageScalingSumForWeapon,
  getVitalABS,
  getVitalArmor,
  getVitalWKN,
  isDamageTypeElemental,
  patchPrecision,
} from '@nw-data/common'
import { EMPTY, combineLatest, map, of, pipe, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { cappedValue } from '~/nw/mannequin/mods/capped-value'
import { NW_WEAPON_TYPES, damageTypeIcon } from '~/nw/weapon-types'

export interface ValueStack {
  value: number
  stack: Array<ValueStackItem>
}

export interface ValueStackItem {
  value: number
  label?: string
  icon?: string
  cap?: number
  disabled?: boolean
  tag?: string
}

export interface OffenderState {
  isBound: boolean // to a gearset
  level: number
  gearScore: number
  attributePoints: Record<AttributeRef, number>
  attributeModSums: Record<AttributeRef, number>
  armorPenetration: ValueStack

  convertAffix: string
  convertPercent: number
  convertScaling: Record<AttributeRef, number>
  convertDamageType: string

  dotDamageType: string
  dotDamagePercent: number
  dotDamageDuration: number
  dotDamageRate: number

  weaponTag: string
  weaponGearScore: number
  weaponScaling: Record<AttributeRef, number>
  weaponDamageType: string
  weaponDamage: number

  damageRow: string
  damageCoef: number
  damageAdd: number

  modPvP: ValueStack
  modAmmo: ValueStack
  modCrit: ValueStack

  modBase: ValueStack
  modBaseConv: ValueStack
  modBaseDot: ValueStack
  modDMG: ValueStack
  modDMGConv: ValueStack
  modDMGDot: ValueStack
}

export interface DefenderState {
  isBound: boolean // to a gearset
  isPlayer: boolean
  vitalId: string
  level: number
  gearScore: number

  physicalArmor: ValueStack
  physicalArmorFortify: ValueStack
  physicalArmorAdd: ValueStack

  elementalArmor: ValueStack
  elementalArmorFortify: ValueStack
  elementalArmorAdd: ValueStack

  modABS: ValueStack
  modABSConv: ValueStack
  modABSDot: ValueStack
  modWKN: ValueStack
  modWKNConv: ValueStack
  modWKNDot: ValueStack
  modBaseReduction: ValueStack
  modBaseReductionConv: ValueStack
  modBaseReductionDot: ValueStack
  modCritReduction: ValueStack
}

export interface DamageCalculatorState {
  offender: OffenderState
  defender: DefenderState
}

const DEFAULT_STATE: DamageCalculatorState = {
  offender: {
    isBound: false,
    level: NW_MAX_CHARACTER_LEVEL,
    gearScore: NW_MAX_GEAR_SCORE,
    attributePoints: {
      str: 5,
      dex: 5,
      int: 5,
      foc: 5,
      con: 5,
    },
    attributeModSums: {
      str: 0,
      dex: 0,
      int: 0,
      foc: 0,
      con: 0,
    },
    armorPenetration: valueStack(),

    dotDamageType: null,
    dotDamagePercent: 0,
    dotDamageDuration: 0,
    dotDamageRate: 1,

    convertAffix: null,
    convertPercent: 0,
    convertDamageType: null,
    convertScaling: {
      str: 0,
      dex: 0,
      int: 0,
      foc: 0,
      con: 0,
    },

    weaponGearScore: NW_MAX_GEAR_SCORE,
    weaponScaling: {
      str: 0,
      dex: 0,
      int: 0,
      foc: 0,
      con: 0,
    },
    weaponDamageType: null,
    weaponDamage: 64,
    weaponTag: null,

    damageRow: null,
    damageCoef: 1,
    damageAdd: 0,

    modPvP: valueStack(),
    modAmmo: valueStack(),
    modCrit: valueStack(),

    modBase: valueStack(),
    modBaseConv: valueStack(),
    modBaseDot: valueStack(),
    modDMG: valueStack(),
    modDMGConv: valueStack(),
    modDMGDot: valueStack(),
  },

  defender: {
    isBound: false,
    isPlayer: true,
    vitalId: null,
    level: NW_MAX_CHARACTER_LEVEL,
    gearScore: NW_MAX_GEAR_SCORE,

    physicalArmor: valueStack(),
    physicalArmorFortify: valueStack(),
    physicalArmorAdd: valueStack(),

    elementalArmor: valueStack(),
    elementalArmorFortify: valueStack(),
    elementalArmorAdd: valueStack(),

    modABS: valueStack(),
    modABSConv: valueStack(),
    modABSDot: valueStack(),

    modWKN: valueStack(),
    modWKNConv: valueStack(),
    modWKNDot: valueStack(),

    modBaseReduction: valueStack(),
    modBaseReductionConv: valueStack(),
    modBaseReductionDot: valueStack(),

    modCritReduction: valueStack(),
  },
}

export type DamageCalculatorStore = InstanceType<typeof DamageCalculatorStore>
export const DamageCalculatorStore = signalStore(
  withState<DamageCalculatorState>(DEFAULT_STATE),
  withComputed(({ offender, defender }) => {
    const physicalRating = computed(() => {
      const armor = valueStackSum(defender.physicalArmor()).value
      const fortify = valueStackSum(defender.physicalArmorFortify()).value
      const add = valueStackSum(defender.physicalArmorAdd()).value
      return armor + armor * fortify + add
    })
    const elementalRating = computed(() => {
      const armor = valueStackSum(defender.elementalArmor()).value
      const fortify = valueStackSum(defender.elementalArmorFortify()).value
      const add = valueStackSum(defender.elementalArmorAdd()).value
      return armor + armor * fortify + add
    })
    const weaponIsElemental = computed(() => {
      return isDamageTypeElemental(offender.weaponDamageType())
    })
    const affixIsElemental = computed(() => {
      return isDamageTypeElemental(offender.convertDamageType())
    })
    const dotIsElemental = computed(() => {
      return isDamageTypeElemental(offender.dotDamageType())
    })
    return {
      offenderLevel: computed(() => offender.level()),
      offenderLevelFactor: computed(() => getDamageScalingForLevel(offender.level())),
      offenderGearScore: computed(() => offender.gearScore()),
      offenderAttributes: computed(() => offender.attributeModSums()),
      offenderArmorPenetration: computed(() => valueStackSum(offender.armorPenetration())),

      offenderDotPercent: computed(() => offender.dotDamagePercent()),
      offenderDotDuration: computed(() => offender.dotDamageDuration()),
      offenderDotRate: computed(() => offender.dotDamageRate()),
      offenderDotDamageType: computed(() => offender.dotDamageType()),
      offenderDotDamageTypeIcon: computed(() => damageTypeIcon(offender.dotDamageType())),
      offenderDotIsActive: computed(() => !!offender.dotDamagePercent()),

      offenderConvertPercent: computed(() => offender.convertPercent()),
      offenderConvertScaling: computed(() => offender.convertScaling()),
      offenderConvertScalingSum: computed(() =>
        getDamageScalingSumForWeapon({
          weapon: offender.convertScaling(),
          modifierSums: offender.attributeModSums(),
        }),
      ),
      offenderConvertDamageType: computed(() => offender.convertDamageType()),
      offenderConvertDamageTypeIcon: computed(() => {
        if (offender.convertDamageType()) {
          return damageTypeIcon(offender.convertDamageType())
        }
        return null
      }),
      offenderConvertIsElemental: affixIsElemental,
      offenderConvertIsActive: computed(() => {
        if (offender.convertPercent()) {
          return true
        }
        const scaling = offender.convertScaling()
        if (!!scaling.dex || !!scaling.foc || !!scaling.int || !!scaling.str) {
          return true
        }
        return false
      }),

      offenderWeaponGearScore: computed(() => offender.weaponGearScore()),
      offenderWeaponGearScoreFactor: computed(() => getDamageFactorForGearScore(offender.weaponGearScore())),
      offenderWeaponScaling: computed(() => offender.weaponScaling()),
      offenderWeaponScalingSum: computed(() =>
        getDamageScalingSumForWeapon({
          weapon: offender.weaponScaling(),
          modifierSums: offender.attributeModSums(),
        }),
      ),
      offenderWeaponDamageType: computed(() => offender.weaponDamageType()),
      offenderWeaponDamageTypeIcon: computed(() => damageTypeIcon(offender.weaponDamageType())),
      offenderWeaponIsElemental: weaponIsElemental,
      offenderWeaponDamage: computed(() => offender.weaponDamage()),

      offenderDamageCoef: computed(() => offender.damageCoef()),
      offenderDamageAdd: computed(() => offender.damageAdd()),

      offenderModPvP: computed(() => valueStackSum(offender.modPvP())),
      offenderModAmmo: computed(() => valueStackSum(offender.modAmmo())),
      offenderModCrit: computed(() => valueStackSum(offender.modCrit())),
      offenderModBase: computed(() => valueStackSum(offender.modBase())),
      offenderModBaseConv: computed(() => valueStackSum(offender.modBaseConv())),
      offenderModBaseDot: computed(() => valueStackSum(offender.modBaseDot())),
      offenderModDMG: computed(() => valueStackSum(offender.modDMG())),
      offenderModDMGConv: computed(() => valueStackSum(offender.modDMGConv())),
      offenderModDMGDot: computed(() => valueStackSum(offender.modDMGDot())),

      defenderIsPlayer: computed(() => defender.isPlayer()),
      defenderVitalId: computed(() => defender.vitalId()),
      defenderLevel: computed(() => defender.level()),
      defenderGearScore: computed(() => defender.gearScore()),

      defenderPhysicalArmor: physicalRating,
      defenderElementalArmor: elementalRating,

      defenderArmorRating: computed(() => (weaponIsElemental() ? elementalRating() : physicalRating())),
      defenderArmorRatingConv: computed(() => (affixIsElemental() ? elementalRating() : physicalRating())),
      defenderArmorRatingDot: computed(() => (dotIsElemental() ? elementalRating() : physicalRating())),

      defenderModABS: computed(() => valueStackSum(defender.modABS())),
      defenderModABSConv: computed(() => valueStackSum(defender.modABSConv())),
      defenderModABSDot: computed(() => valueStackSum(defender.modABSDot())),

      defenderModWKN: computed(() => valueStackSum(defender.modWKN())),
      defenderModWKNConv: computed(() => valueStackSum(defender.modWKN())),
      defenderModWKNDot: computed(() => valueStackSum(defender.modWKNDot())),

      defenderModBaseReduction: computed(() => valueStackSum(defender.modBaseReduction())),
      defenderModBaseReductionConv: computed(() => valueStackSum(defender.modBaseReductionConv())),
      defenderModBaseReductionDot: computed(() => valueStackSum(defender.modBaseReductionDot())),

      defenderModCritReduction: computed(() => valueStackSum(defender.modCritReduction())),
    }
  }),

  withComputed((state) => {
    return {
      output: computed(() => {
        return calculateDamage({
          attacker: {
            isPlayer: true,
            level: state.offenderLevel(),
            gearScore: state.offenderGearScore(),
            attributeModSums: state.offenderAttributes(),
            armorPenetration: state.offenderArmorPenetration().value,

            dotCoef: state.offenderDotPercent(),
            dotDuration: state.offenderDotDuration(),
            dotRate: state.offenderDotRate(),

            preferHigherScaling: !!state.offenderConvertIsActive(),
            convertPercent: state.offenderConvertPercent(),
            convertScaling: state.offenderConvertScaling(),

            weaponScaling: state.offenderWeaponScaling(),
            weaponGearScore: state.offenderWeaponGearScore(),
            weaponDamage: state.offenderWeaponDamage(),
            damageCoef: state.offenderDamageCoef(),
            damageAdd: state.offenderDamageAdd(),

            modPvp: state.offenderModPvP().value,
            modAmmo: state.offenderModAmmo().value,
            modCrit: state.offenderModCrit().value,

            modBase: state.offenderModBase().value,
            modBaseAffix: state.offenderModBaseConv().value,
            modBaseDot: state.offenderModBaseDot().value,

            modDMG: state.offenderModDMG().value,
            modDMGAffix: state.offenderModDMGConv().value,
            modDMGDot: state.offenderModDMGDot().value,
          },
          defender: {
            isPlayer: state.defenderIsPlayer(),
            level: state.defenderLevel(),
            gearScore: state.defenderGearScore(),

            armorRating: state.defenderArmorRating(),
            armorRatingAffix: state.defenderArmorRatingConv(),
            armorRatingDot: state.defenderArmorRatingDot(),

            modABS: state.defenderModABS().value,
            modABSAffix: state.defenderModABSConv().value,
            modABSDot: state.defenderModABSDot().value,

            modWKN: state.defenderModWKN().value,
            modWKNAffix: state.defenderModWKNConv().value,
            modWKNDot: state.defenderModWKNDot().value,

            reductionBase: state.defenderModBaseReduction().value,
            reductionBaseAffix: state.defenderModBaseReductionConv().value,
            reductionBaseDot: state.defenderModBaseReductionDot().value,

            reductionCrit: state.defenderModCritReduction().value,
          },
        })
      }),
    }
  }),
  withMethods((state) => {
    const data = inject(NwDataService)
    const injector = inject(Injector)
    return {
      connectWeaponTag: rxMethod<void>(
        pipe(
          switchMap(() => {
            return combineLatest({
              weaponTag: toObservable(state.offender.weaponTag, {
                injector: injector,
              }),
              damageRow: toObservable(state.offender.damageRow, {
                injector: injector,
              }),
            })
          }),
          switchMap(({ weaponTag, damageRow }) => {
            const weaponType = NW_WEAPON_TYPES.find((it) => it.WeaponTag === weaponTag)

            return combineLatest({
              weaponType: of(weaponType),
              weapon: data.weapon(weaponType?.StatsRef),
              damageRow: data.damageTable0(damageRow),
            })
          }),
          map(({ weaponType, weapon, damageRow }) => {
            patchState(state, ({ offender }) => {
              return {
                offender: {
                  ...offender,
                  damageCoef: damageRow?.DmgCoef ?? 1,
                  damageAdd: damageRow?.AddDmg ?? 0,
                  weaponTag: weaponType?.WeaponTag,
                  weaponDamage: weapon?.BaseDamage ?? 0,
                  weaponDamageType: weaponType?.DamageType,
                  weaponScaling: {
                    con: 0,
                    dex: weapon?.ScalingDexterity || 0,
                    str: weapon?.ScalingStrength || 0,
                    foc: weapon?.ScalingFocus || 0,
                    int: weapon?.ScalingIntelligence || 0,
                  },
                },
              }
            })
          }),
        ),
      ),
      connectAttributes: rxMethod<void>(
        pipe(
          switchMap(() => {
            return combineLatest({
              attributes: toObservable(state.offender.attributePoints, {
                injector: injector,
              }),
              conMap: data.attrConByLevel,
              dexMap: data.attrDexByLevel,
              focMap: data.attrFocByLevel,
              intMap: data.attrIntByLevel,
              strMap: data.attrStrByLevel,
            })
          }),
          map(({ attributes, conMap, dexMap, focMap, intMap, strMap }) => {
            patchState(state, ({ offender }) => {
              function index(i: number) {
                return Math.max(Math.min(i, NW_MAX_POINTS_PER_ATTRIBUTE), NW_MIN_POINTS_PER_ATTRIBUTE)
              }
              return {
                offender: {
                  ...offender,
                  attributeModSums: {
                    con: conMap.get(index(attributes.con))?.ModifierValueSum ?? 0,
                    dex: dexMap.get(index(attributes.dex))?.ModifierValueSum ?? 0,
                    foc: focMap.get(index(attributes.foc))?.ModifierValueSum ?? 0,
                    int: intMap.get(index(attributes.int))?.ModifierValueSum ?? 0,
                    str: strMap.get(index(attributes.str))?.ModifierValueSum ?? 0,
                  },
                },
              }
            })
          }),
        ),
      ),
      connectAffix: rxMethod<void>(
        pipe(
          switchMap(() => {
            return combineLatest({
              affix: toObservable(state.offender.convertAffix, {
                injector: injector,
              }),
              affixMap: data.affixStatsMap,
            })
          }),
          map(({ affix, affixMap }) => {
            const stats = affixMap.get(affix)
            patchState(state, ({ offender }) => {
              return {
                offender: {
                  ...offender,
                  convertPercent: stats?.DamagePercentage ?? 0,
                  convertDamageType: stats?.DamageType,
                  convertScaling: {
                    con: 0,
                    dex: stats?.ScalingDexterity ?? 0,
                    foc: stats?.ScalingFocus ?? 0,
                    int: stats?.ScalingIntelligence ?? 0,
                    str: stats?.ScalingStrength ?? 0,
                  },
                },
              }
            })
          }),
        ),
      ),
      connectVital: rxMethod<void>(
        pipe(
          switchMap(() => data.vital(toObservable(state.defender.vitalId, { injector: injector }))),
          switchMap((vital) => {
            if (!vital) {
              return EMPTY
            }
            return combineLatest({
              dmgTypeWeapon: toObservable(state.offender.weaponDamageType, { injector }),
              dmgTypeConvert: toObservable(state.offender.convertDamageType, { injector }),
              vitalLevel: data.vitalsLevel(toObservable(state.defender.level, { injector })),
              vital: of(vital),
            })
          }),
          map(({ dmgTypeWeapon, dmgTypeConvert, vital, vitalLevel }) => {
            const armor = getVitalArmor(vital, vitalLevel)
            patchState(
              state,
              updateDefender({
                isPlayer: false,
                gearScore: vitalLevel.GearScore,
                modABS: {
                  value: getVitalABS(vital, dmgTypeWeapon as any),
                  stack: state.defender.modABS.stack(),
                },
                modABSConv: {
                  value: getVitalABS(vital, dmgTypeConvert as any),
                  stack: state.defender.modABSConv.stack(),
                },
                modWKN: {
                  value: getVitalWKN(vital, dmgTypeWeapon as any),
                  stack: state.defender.modWKN.stack(),
                },
                modWKNConv: {
                  value: getVitalWKN(vital, dmgTypeConvert as any),
                  stack: state.defender.modWKNConv.stack(),
                },
                elementalArmor: {
                  value: armor.elementalRating,
                  stack: state.defender.elementalArmor.stack(),
                },
                elementalArmorAdd: {
                  value: 0,
                  stack: state.defender.elementalArmorAdd.stack(),
                },
                elementalArmorFortify: {
                  value: 0,
                  stack: state.defender.elementalArmorFortify.stack(),
                },
                physicalArmor: {
                  value: armor.physicalRating,
                  stack: state.defender.physicalArmor.stack(),
                },
                physicalArmorAdd: {
                  value: 0,
                  stack: state.defender.physicalArmorAdd.stack(),
                },
                physicalArmorFortify: {
                  value: 0,
                  stack: state.defender.physicalArmorFortify.stack(),
                },
              }),
            )
          }),
        ),
      ),
      setState: (input: DamageCalculatorState) => {
        patchState(state, input)
      },
      reset: () => {
        patchState(state, DEFAULT_STATE)
      },
      resetOffender: () => {
        patchState(state, updateOffender(DEFAULT_STATE.offender))
      },
      resetDefender: () => {
        patchState(state, updateDefender(DEFAULT_STATE.defender))
      },
    }
  }),
)

function valueStack() {
  return {
    value: 0,
    stack: [],
  }
}

export function valueStackSum(data: ValueStack) {
  const result = cappedValue()
  if (data) {
    result.add(data.value)

    const uncapped = data.stack.filter((it) => !it.disabled && !it.value)
    for (const item of uncapped) {
      result.add(item.value)
    }

    const capped = data.stack.filter((it) => !it.disabled && !!it.value)
    for (const item of capped) {
      result.add(item.value, item.cap)
    }
  }

  return {
    value: result.total,
    overflow: result.overflow,
  }
}

export function updateOffender<T extends { offender: OffenderState }>(input: Partial<OffenderState>) {
  return (state: T): T => {
    return {
      ...state,
      offender: {
        ...state.offender,
        ...input,
      },
    }
  }
}

export function updateDefender<T extends { defender: DefenderState }>(input: Partial<DefenderState>) {
  return (state: T): T => {
    return {
      ...state,
      defender: {
        ...state.defender,
        ...input,
      },
    }
  }
}

export function offenderAccessor<K extends keyof OffenderState>(
  store: DamageCalculatorStore,
  key: K,
  options?: { precision?: number },
) {
  const precision = options?.precision
  return {
    get value(): OffenderState[K] {
      let value = store.offender?.[key]() as OffenderState[K]
      if (typeof value === 'number' && precision) {
        value = patchPrecision(value, precision) as OffenderState[K]
      }
      return value
    },
    set value(value: OffenderState[K]) {
      patchState(store, updateOffender({ [key]: value }))
    },
  }
}

export function defenderAccessor<K extends keyof DefenderState>(
  store: DamageCalculatorStore,
  key: K,
  options?: { scale?: number; precision?: number },
) {
  const scale = options?.scale ?? 1
  const precision = options?.precision
  return {
    get value(): DefenderState[K] {
      let value = store.defender?.[key]() as DefenderState[K]
      if (typeof value === 'number') {
        value = (value * scale) as DefenderState[K]
      }
      if (typeof value === 'number' && precision) {
        value = patchPrecision(value, precision) as DefenderState[K]
      }
      return value
    },
    set value(value: DefenderState[K]) {
      if (typeof value === 'number') {
        value = (value / scale) as DefenderState[K]
      }
      patchState(store, updateDefender({ [key]: value }))
    },
  }
}
