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
  damageExpression
} from '@nw-data/common'
import { AttackType } from '@nw-data/generated'
import { EMPTY, combineLatest, map, of, pipe, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { NW_WEAPON_TYPES, damageTypeIcon } from '~/nw/weapon-types'
import { DamageModStack, damageModStack, damageModSum } from './damage-mod-stack'

export interface OffenderState {
  isBound: boolean // to a gearset
  level: number
  gearScore: number
  attributePoints: Record<AttributeRef, number>
  attributeModSums: Record<AttributeRef, number>
  attributeHealSum: number
  armorPenetration: DamageModStack

  affixId: string
  affixPercent: number
  affixScaling: Record<AttributeRef, number>
  affixDamageType: string

  dotDamageType: string
  dotDamagePercent: number
  dotDamagePotency: number
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
  attackType: AttackType
  attackKind: 'Melee' | 'Ranged'

  modPvP: DamageModStack
  modAmmo: DamageModStack
  modCrit: DamageModStack

  modBase: DamageModStack
  modBaseDot: DamageModStack
  modBaseAffix: DamageModStack
  modDMG: DamageModStack
  modDMGDot: DamageModStack
  modDMGAffix: DamageModStack
}

export interface DefenderState {
  isBound: boolean // to a gearset
  isPlayer: boolean
  vitalId: string
  level: number
  gearScore: number

  physicalArmor: DamageModStack
  physicalArmorFortify: DamageModStack
  physicalArmorAdd: DamageModStack

  elementalArmor: DamageModStack
  elementalArmorFortify: DamageModStack
  elementalArmorAdd: DamageModStack

  modABS: DamageModStack
  modABSDot: DamageModStack
  modABSAffix: DamageModStack
  modWKN: DamageModStack
  modWKNDot: DamageModStack
  modWKNAffix: DamageModStack
  modBaseReduction: DamageModStack
  modBaseReductionDot: DamageModStack
  modBaseReductionAffix: DamageModStack
  modCritReduction: DamageModStack
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
    attributeHealSum: 0,
    armorPenetration: damageModStack(),

    dotDamageType: null,
    dotDamagePercent: 0,
    dotDamagePotency: 0,
    dotDamageDuration: 0,
    dotDamageRate: 1,

    affixId: null,
    affixPercent: 0,
    affixDamageType: null,
    affixScaling: {
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
    attackType: null,
    attackKind: null,

    modPvP: damageModStack(),
    modAmmo: damageModStack(),
    modCrit: damageModStack(),

    modBase: damageModStack(),
    modBaseAffix: damageModStack(),
    modBaseDot: damageModStack(),
    modDMG: damageModStack(),
    modDMGAffix: damageModStack(),
    modDMGDot: damageModStack(),
  },

  defender: {
    isBound: false,
    isPlayer: true,
    vitalId: null,
    level: NW_MAX_CHARACTER_LEVEL,
    gearScore: NW_MAX_GEAR_SCORE,

    physicalArmor: damageModStack(),
    physicalArmorFortify: damageModStack(),
    physicalArmorAdd: damageModStack(),

    elementalArmor: damageModStack(),
    elementalArmorFortify: damageModStack(),
    elementalArmorAdd: damageModStack(),

    modABS: damageModStack(),
    modABSAffix: damageModStack(),
    modABSDot: damageModStack(),

    modWKN: damageModStack(),
    modWKNAffix: damageModStack(),
    modWKNDot: damageModStack(),

    modBaseReduction: damageModStack(),
    modBaseReductionAffix: damageModStack(),
    modBaseReductionDot: damageModStack(),

    modCritReduction: damageModStack(),
  },
}

export type DamageCalculatorStore = InstanceType<typeof DamageCalculatorStore>
export const DamageCalculatorStore = signalStore(
  { protectedState: false },
  withState<DamageCalculatorState>(DEFAULT_STATE),
  withComputed(({ offender, defender }) => {
    const attackContext = computed(() => {
      return {
        type: offender.attackType(),
        kind: offender.attackKind(),
      }
    })
    const physicalRating = computed(() => {
      const armor = damageModSum(defender.physicalArmor(), attackContext()).value
      const fortify = damageModSum(defender.physicalArmorFortify(), attackContext()).value
      const add = damageModSum(defender.physicalArmorAdd(), attackContext()).value
      return armor + armor * fortify + add
    })
    const elementalRating = computed(() => {
      const armor = damageModSum(defender.elementalArmor(), attackContext()).value
      const fortify = damageModSum(defender.elementalArmorFortify(), attackContext()).value
      const add = damageModSum(defender.elementalArmorAdd(), attackContext()).value
      return armor + armor * fortify + add
    })
    const weaponIsElemental = computed(() => {
      return isDamageTypeElemental(offender.weaponDamageType())
    })
    const affixIsElemental = computed(() => {
      return isDamageTypeElemental(offender.affixDamageType())
    })
    const dotIsElemental = computed(() => {
      return isDamageTypeElemental(offender.dotDamageType())
    })
    return {
      attackContext,
      offenderLevel: computed(() => offender.level()),
      offenderLevelFactor: computed(() => getDamageScalingForLevel(offender.level())),
      offenderGearScore: computed(() => offender.gearScore()),
      offenderAttributes: computed(() => offender.attributeModSums()),
      offenderArmorPenetration: computed(() => damageModSum(offender.armorPenetration(), attackContext())),

      offenderDotPercent: computed(() => offender.dotDamagePercent()),
      offenderDotPotency: computed(() => offender.dotDamagePotency()),
      offenderDotCoef: computed(() => {
        return offender.dotDamagePercent() * (1 + (offender.dotDamagePotency() ?? 0))
      }),
      offenderDotDuration: computed(() => offender.dotDamageDuration()),
      offenderDotRate: computed(() => offender.dotDamageRate()),
      offenderDotDamageType: computed(() => offender.dotDamageType()),
      offenderDotDamageTypeIcon: computed(() => damageTypeIcon(offender.dotDamageType())),
      offenderDotIsActive: computed(() => !!offender.dotDamagePercent()),

      offenderAffixPercent: computed(() => offender.affixPercent()),
      offenderAffixScaling: computed(() => offender.affixScaling()),
      offenderAffixScalingSum: computed(() =>
        getDamageScalingSumForWeapon({
          weapon: offender.affixScaling(),
          modifierSums: offender.attributeModSums(),
        }),
      ),
      offenderConvertDamageType: computed(() => offender.affixDamageType()),
      offenderAffixDamageTypeIcon: computed(() => {
        if (offender.affixDamageType()) {
          return damageTypeIcon(offender.affixDamageType())
        }
        return null
      }),
      offenderConvertIsElemental: affixIsElemental,
      offenderAffixIsActive: computed(() => {
        if (offender.affixPercent()) {
          return true
        }
        const scaling = offender.affixScaling()
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

      offenderModPvP: computed(() => damageModSum(offender.modPvP(), attackContext())),
      offenderModAmmo: computed(() => damageModSum(offender.modAmmo(), attackContext())),
      offenderModCrit: computed(() => damageModSum(offender.modCrit(), attackContext())),
      offenderModBase: computed(() => damageModSum(offender.modBase(), attackContext())),
      offenderModBaseDot: computed(() => damageModSum(offender.modBaseDot(), attackContext())),
      offenderModBaseAffix: computed(() => damageModSum(offender.modBaseAffix(), attackContext())),
      offenderModDMG: computed(() => damageModSum(offender.modDMG(), attackContext())),
      offenderModDMGDot: computed(() => damageModSum(offender.modDMGDot(), attackContext())),
      offenderModDMGAffix: computed(() => damageModSum(offender.modDMGAffix(), attackContext())),

      defenderIsPlayer: computed(() => defender.isPlayer()),
      defenderVitalId: computed(() => defender.vitalId()),
      defenderLevel: computed(() => defender.level()),
      defenderGearScore: computed(() => defender.gearScore()),

      defenderPhysicalArmor: physicalRating,
      defenderElementalArmor: elementalRating,

      defenderArmorRating: computed(() => (weaponIsElemental() ? elementalRating() : physicalRating())),
      defenderArmorRatingDot: computed(() => (dotIsElemental() ? elementalRating() : physicalRating())),
      defenderArmorRatingAffix: computed(() => (affixIsElemental() ? elementalRating() : physicalRating())),

      defenderModABS: computed(() => damageModSum(defender.modABS(), attackContext())),
      defenderModABSDot: computed(() => damageModSum(defender.modABSDot(), attackContext())),
      defendermodABSAffix: computed(() => damageModSum(defender.modABSAffix(), attackContext())),

      defenderModWKN: computed(() => damageModSum(defender.modWKN(), attackContext())),
      defenderModWKNDot: computed(() => damageModSum(defender.modWKNDot(), attackContext())),
      defenderModWKNAffix: computed(() => damageModSum(defender.modWKNAffix(), attackContext())),

      defenderModBaseReduction: computed(() => damageModSum(defender.modBaseReduction(), attackContext())),
      defenderModBaseReductionDot: computed(() => damageModSum(defender.modBaseReductionDot(), attackContext())),
      defenderModBaseReductionAffix: computed(() => damageModSum(defender.modBaseReductionAffix(), attackContext())),

      defenderModCritReduction: computed(() => damageModSum(defender.modCritReduction(), attackContext())),
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
            dotPotency: state.offenderDotPotency(),
            dotDuration: state.offenderDotDuration(),
            dotRate: state.offenderDotRate(),

            preferHigherScaling: !!state.offenderAffixIsActive(),
            affixPercent: state.offenderAffixPercent(),
            affixScaling: state.offenderAffixScaling(),

            weaponScaling: state.offenderWeaponScaling(),
            weaponGearScore: state.offenderWeaponGearScore(),
            weaponDamage: state.offenderWeaponDamage(),
            damageCoef: state.offenderDamageCoef(),
            damageAdd: state.offenderDamageAdd(),

            modPvp: state.offenderModPvP().value,
            modAmmo: state.offenderModAmmo().value,
            modCrit: state.offenderModCrit().value,

            modBase: state.offenderModBase().value,
            modBaseAffix: state.offenderModBaseAffix().value,
            modBaseDot: state.offenderModBaseDot().value,

            modDMG: state.offenderModDMG().value,
            modDMGAffix: state.offenderModDMGAffix().value,
            modDMGDot: state.offenderModDMGDot().value,
          },
          defender: {
            isPlayer: state.defenderIsPlayer(),
            level: state.defenderLevel(),
            gearScore: state.defenderGearScore(),

            armorRating: state.defenderArmorRating(),
            armorRatingDot: state.defenderArmorRatingDot(),
            armorRatingAffix: state.defenderArmorRatingAffix(),

            modABS: state.defenderModABS().value,
            modABSDot: state.defenderModABSDot().value,
            modABSAffix: state.defendermodABSAffix().value,

            modWKN: state.defenderModWKN().value,
            modWKNDot: state.defenderModWKNDot().value,
            modWKNAffix: state.defenderModWKNAffix().value,

            reductionCrit: state.defenderModCritReduction().value,
            reductionBase: state.defenderModBaseReduction().value,
            reductionBaseDot: state.defenderModBaseReductionDot().value,
            reductionBaseAffix: state.defenderModBaseReductionAffix().value,
          },
        })
      }),
      output2: computed(() => {
        return damageExpression({
          attacker: {
            isPlayer: true,
            level: state.offenderLevel(),
            gearScore: state.offenderGearScore(),
            attributeModSums: state.offenderAttributes(),
            armorPenetration: state.offenderArmorPenetration().value,

            dotCoef: state.offenderDotPercent(),
            dotPotency: state.offenderDotPotency(),
            dotDuration: state.offenderDotDuration(),
            dotRate: state.offenderDotRate(),

            preferHigherScaling: !!state.offenderAffixIsActive(),
            affixPercent: state.offenderAffixPercent(),
            affixScaling: state.offenderAffixScaling(),

            weaponScaling: state.offenderWeaponScaling(),
            weaponGearScore: state.offenderWeaponGearScore(),
            weaponDamage: state.offenderWeaponDamage(),
            damageCoef: state.offenderDamageCoef(),
            damageAdd: state.offenderDamageAdd(),

            modPvp: state.offenderModPvP().value,
            modAmmo: state.offenderModAmmo().value,
            modCrit: state.offenderModCrit().value,

            modBase: state.offenderModBase().value,
            modBaseAffix: state.offenderModBaseAffix().value,
            modBaseDot: state.offenderModBaseDot().value,

            modDMG: state.offenderModDMG().value,
            modDMGAffix: state.offenderModDMGAffix().value,
            modDMGDot: state.offenderModDMGDot().value,
          },
          defender: {
            isPlayer: state.defenderIsPlayer(),
            level: state.defenderLevel(),
            gearScore: state.defenderGearScore(),

            armorRating: state.defenderArmorRating(),
            armorRatingDot: state.defenderArmorRatingDot(),
            armorRatingAffix: state.defenderArmorRatingAffix(),

            modABS: state.defenderModABS().value,
            modABSDot: state.defenderModABSDot().value,
            modABSAffix: state.defendermodABSAffix().value,

            modWKN: state.defenderModWKN().value,
            modWKNDot: state.defenderModWKNDot().value,
            modWKNAffix: state.defenderModWKNAffix().value,

            reductionCrit: state.defenderModCritReduction().value,
            reductionBase: state.defenderModBaseReduction().value,
            reductionBaseDot: state.defenderModBaseReductionDot().value,
            reductionBaseAffix: state.defenderModBaseReductionAffix().value,
          },
        })
      }),
    }
  }),
  withMethods((state) => {
    const db = injectNwData()
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
              weapon: db.weaponItemsById(weaponType?.StatsRef),
              damageRow: db.damageTable0(damageRow),
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
              conMap: db.attrConByLevel(),
              dexMap: db.attrDexByLevel(),
              focMap: db.attrFocByLevel(),
              intMap: db.attrIntByLevel(),
              strMap: db.attrStrByLevel(),
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
                  attributeHealSum: focMap.get(index(attributes.foc))?.ScalingValue ?? 0,
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
              affix: toObservable(state.offender.affixId, {
                injector: injector,
              }),
              affixMap: db.affixStatsByIdMap(),
            })
          }),
          map(({ affix, affixMap }) => {
            const stats = affixMap.get(affix)
            patchState(state, ({ offender }) => {
              return {
                offender: {
                  ...offender,
                  affixPercent: stats?.DamagePercentage ?? 0,
                  affixDamageType: stats?.DamageType,
                  affixScaling: {
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
          switchMap(() => toObservable(state.defender.vitalId, { injector: injector })),
          switchMap((vitalId) => db.vitalsById(vitalId)),
          switchMap((vital) => {
            if (!vital) {
              return EMPTY
            }
            return combineLatest({
              dmgTypeWeapon: toObservable(state.offender.weaponDamageType, { injector }),
              dmgTypeAffix: toObservable(state.offender.affixDamageType, { injector }),
              dmgTypeDot: toObservable(state.offender.dotDamageType, { injector }),
              vitalLevel: toObservable(state.defender.level, { injector }).pipe(
                switchMap((level) => db.vitalsLevelsByLevel(level)),
              ),
              vital: of(vital),
            })
          }),
          map(({ dmgTypeWeapon, dmgTypeAffix, dmgTypeDot, vital, vitalLevel }) => {
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
                modABSDot: {
                  value: getVitalABS(vital, dmgTypeDot as any),
                  stack: state.defender.modABSDot.stack(),
                },
                modABSAffix: {
                  value: getVitalABS(vital, dmgTypeAffix as any),
                  stack: state.defender.modABSAffix.stack(),
                },

                modWKN: {
                  value: getVitalWKN(vital, dmgTypeWeapon as any),
                  stack: state.defender.modWKN.stack(),
                },
                modWKNDot: {
                  value: getVitalWKN(vital, dmgTypeDot as any),
                  stack: state.defender.modWKNDot.stack(),
                },
                modWKNAffix: {
                  value: getVitalWKN(vital, dmgTypeAffix as any),
                  stack: state.defender.modWKNAffix.stack(),
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
