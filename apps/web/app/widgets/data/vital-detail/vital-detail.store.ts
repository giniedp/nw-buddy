import { inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  BuffBucket,
  NW_MAX_ENEMY_LEVEL,
  getVitalArmor,
  getVitalCategoryInfo,
  getVitalDamage,
  getVitalDungeons,
  getVitalHealth,
} from '@nw-data/common'
import {
  AbilityData,
  DATASHEETS,
  DamageData,
  StatusEffectData,
  VitalsCategoryData,
  VitalsBaseData as VitalsData,
} from '@nw-data/generated'
import { ScannedVital } from '@nw-data/scanner'
import { uniq } from 'lodash'
import { Observable, combineLatest, map, of, pipe, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { eqCaseInsensitive, selectSignal } from '~/utils'

export interface VitalDetailState {
  vitalId: string
  levelOverride?: number
  enableDamage?: boolean
  mutaElementId?: string
  mutaDifficultyId?: number
}

export interface DamageTableFile {
  name: string
  rows: DamageData[]
}

export const VitalDetailStore = signalStore(
  { protectedState: false },
  withState<VitalDetailState>({
    vitalId: null,
    levelOverride: null,
    enableDamage: false,
    mutaElementId: null,
    mutaDifficultyId: null,
  }),
  withComputed(({ vitalId, levelOverride }) => {
    const db = inject(NwDataService)
    const vital = selectSignal(db.vital(vitalId))
    return {
      vital,
      creatureType: selectSignal(vital, (it) => it?.CreatureType),
      displayName: selectSignal(vital, (it) => it?.DisplayName),
      level: selectSignal(
        {
          vital,
          level: levelOverride,
        },
        ({ vital, level }): number => level ?? vital?.Level,
      ),
    }
  }),
  withComputed(({ vitalId, level, creatureType }) => {
    const db = inject(NwDataService)

    const modifier = selectSignal(db.vitalsModifier(creatureType))
    const levelData = selectSignal(db.vitalsLevel(level))
    const gearScore = selectSignal(levelData, (it) => it?.GearScore)
    const metadata = selectSignal(db.vitalsMeta(vitalId))
    const aliasNames = selectSignal(
      {
        metadata,
        categories: db.vitalsCategoriesMap,
      },
      ({ metadata, categories }) => {
        if (!metadata || !categories) {
          return []
        }
        return uniq(metadata.catIDs.map((id) => categories.get(id)?.DisplayName?.trim()).filter((it) => it))
      },
    )
    return {
      metadata,
      aliasNames,
      modifier,
      levelData,
      gearScore,
    }
  }),
  withComputed((state) => {
    const db = inject(NwDataService)

    const dungeons = selectSignal(
      {
        vital: state.vital,
        dungeons: db.gameModes,
        meta: db.vitalsMetadataMap,
      },
      ({ vital, dungeons, meta }) => getVitalDungeons(vital, dungeons, meta),
    )
    const isVitalFromDungeon = selectSignal(dungeons, (it) => !!it?.length)
    const mutaDifficulty = selectSignal(db.mutatorDifficulty(state.mutaDifficultyId))

    // readonly mutaElementId$ = this.select(({ mutaElementId }) => mutaElementId)
    const mutaElement = selectSignal(db.mutatorElement(state.mutaElementId))
    const mutaBuffs = selectSignal(
      combineLatest({
        element: toObservable(mutaElement),
        buffMap: db.buffBucketsMap,
        effectMap: db.statusEffectsMap,
        abilitiesMap: db.abilitiesMap,
        creatureType: toObservable(state.creatureType),
      }),
      (data) => {
        return collectBuffs({
          bucketIds: [data.element?.[data.creatureType]],
          buffMap: data.buffMap,
          effectMap: data.effectMap,
          abilitiesMap: data.abilitiesMap,
        })
      },
    )

    const vitalBuffs = selectSignal(
      combineLatest({
        vital: toObservable(state.vital),
        buffMap: db.buffBucketsMap,
        effectMap: db.statusEffectsMap,
        abilitiesMap: db.abilitiesMap,
      }),
      (data) => {
        return collectBuffs({
          bucketIds: (data.vital.BuffBuckets || '').split(','),
          buffMap: data.buffMap,
          effectMap: data.effectMap,
          abilitiesMap: data.abilitiesMap,
        })
      },
    )

    const buffs = selectSignal({ mutaBuffs, vitalBuffs }, ({ mutaBuffs, vitalBuffs }) => {
      return [...(mutaBuffs || []), ...(vitalBuffs || [])]
    })

    const combatCategories = selectSignal(state.vital, getVitalCategoryInfo)
    const categories = selectSignal(
      {
        vital: state.vital,
        categoriesMap: db.vitalsCategoriesMap,
      },
      ({ vital, categoriesMap }) => selectCategories(vital, categoriesMap),
    )
    const damageTableNames = selectSignal(
      {
        vitalId: state.vitalId,
        meta: state.metadata,
      },
      ({ vitalId, meta }) => selectDamageTableNames(vitalId, meta),
    )

    const damageTables = selectSignal(
      toObservable(damageTableNames).pipe(switchMap((files) => loadDamageTables(files, db))),
    )

    const damage = selectSignal(
      {
        vital: state.vital,
        level: state.levelData,
        modifier: state.modifier,
        difficulty: mutaDifficulty,
      },
      ({ vital, modifier, level, difficulty }): number => {
        return getVitalDamage({
          vital,
          level,
          damageTable: { DmgCoef: 1, AddDmg: 0 },
          difficulty,
          modifier,
        })
      },
    )
    const hasDamageTable = selectSignal(damageTableNames, (it) => !!it?.length)

    const health = selectSignal(
      {
        vital: state.vital,
        level: state.levelData,
        modifier: state.modifier,
        difficulty: mutaDifficulty,
      },
      (data) => getVitalHealth(data),
    )

    const armor = selectSignal(
      {
        vital: state.vital,
        level: state.levelData,
      },
      ({ vital, level }) => getVitalArmor(vital, level),
    )
    return {
      armor,
      buffs,
      categories,
      combatCategories,
      damage,
      damageTableNames,
      damageTables,
      dungeons,
      hasDamageTable,
      health,
      isVitalFromDungeon,
      mutaBuffs,
      mutaDifficulty,
      mutaElement,
      vitalBuffs,
    }
  }),
  withMethods((state) => {
    const isVitalFromDungeon$ = toObservable(state.isVitalFromDungeon)
    return {
      loadById: rxMethod<string>(pipe(map((id) => patchState(state, { vitalId: id, levelOverride: null })))),
      loadMutaDifficulty: rxMethod<number>(
        pipe(
          switchMap((id) => {
            return combineLatest({
              appearsInDungeon: isVitalFromDungeon$,
              difficulty: of(id),
            })
          }),
          map(({ appearsInDungeon, difficulty }) => {
            if (!appearsInDungeon) {
              return patchState(state, {
                mutaDifficultyId: null,
                levelOverride: null,
              })
            } else {
              return patchState(state, {
                mutaDifficultyId: difficulty,
                levelOverride: difficulty ? NW_MAX_ENEMY_LEVEL : null,
              })
            }
          }),
        ),
      ),
    }
  }),
)

function loadDamageTables(files: string[], db: NwDataService): Observable<Array<DamageTableFile>> {
  if (!files?.length) {
    return of([])
  }
  const tables = Object.entries(DATASHEETS.DamageData)
  return combineLatest(
    files
      .map((file) => {
        file = 'datatables/' + file.replace(/\\/g, '/').replace(/\.xml$/, '.json')
        return tables.find(([_, url]) => eqCaseInsensitive(url.uri, file))
      })
      .filter((it) => !!it)
      .map(([name, uri]) => {
        return db.load(uri).pipe(
          map((rows): DamageTableFile => {
            return {
              name,
              rows,
            }
          }),
        )
      }),
  )
}

function selectCategories(vital: VitalsData, categories: Map<string, VitalsCategoryData>) {
  return vital.VitalsCategories?.map((id) => categories.get(id))
}

function selectDamageTableNames(id: string, meta: ScannedVital) {
  let tables = meta?.tables || []
  // TODO: fix this in the pipeline
  if (id === 'Isabella_DG_ShatterMtn_Phase2_00') {
    tables = tables.filter((it) => it.toLowerCase().includes('phase2'))
  }
  if (id === 'Dryad_Siren') {
    tables = tables.filter((it) => it.toLowerCase().includes('dryad_siren'))
  }
  return tables
}

function collectBuffs(
  data: {
    bucketIds: string[]
    buffMap: Map<string, BuffBucket>
    effectMap: Map<string, StatusEffectData>
    abilitiesMap: Map<string, AbilityData>
    chance?: number
    odd?: boolean
  },
  result: Buff[] = [],
) {
  let odd = data.odd ?? true
  for (const bucketId of data.bucketIds || []) {
    const bucket = data.buffMap.get(bucketId)
    if (!bucket?.Buffs?.length) {
      continue
    }
    if (data.odd == null && bucket.TableType === 'OR') {
      odd = !odd
    }
    for (let i = 0; i < bucket.Buffs.length; i++) {
      const chance = getBuffChance(bucket, i) * (data.chance ?? 1)
      const row = bucket.Buffs[i]

      if (row.BuffType === 'StatusEffect') {
        appendBuff(result, {
          chance,
          effect: data.effectMap.get(row.Buff),
          odd,
        })
        continue
      }
      if (row.BuffType === 'BuffBucket' && row.Buff) {
        collectBuffs(
          {
            ...data,
            bucketIds: [row.Buff],
            chance,
            odd,
          },
          result,
        )
        continue
      }
      if (row.BuffType === 'Ability') {
        appendBuff(result, {
          chance,
          ability: data.abilitiesMap.get(row.Buff),
          odd,
        })
        continue
      }
      if (row.BuffType === 'Promotion') {
        continue
      }
    }
  }

  return result
}
interface Buff {
  chance: number
  effect?: StatusEffectData
  ability?: AbilityData
  odd: boolean
}

function appendBuff(buffs: Buff[], buff: Buff) {
  const existing = buffs.find((it) => {
    if (buff.effect) {
      return it.effect?.StatusID === buff.effect.StatusID
    }
    if (buff.ability) {
      return it.ability?.AbilityID === buff.ability.AbilityID
    }
    return false
  })
  if (existing) {
    existing.chance = Math.max(existing.chance, buff.chance)
  } else {
    buffs.push(buff)
  }
}

function getBuffChance(bucket: BuffBucket, row: number) {
  if (bucket.TableType === 'AND') {
    if (bucket.MaxRoll > 0) {
      console.warn('AND table with MaxRoll > 0')
    }
    return 1
  }

  if (!bucket.MaxRoll) {
    console.warn('OR table with MaxRoll = 0')
    return 1
  }

  const prob = Number(bucket.Buffs[row].BuffProb)
  let ceiling = bucket.MaxRoll
  if (row < bucket.Buffs.length - 1) {
    ceiling = Number(bucket.Buffs[row + 1].BuffProb)
  }
  return (ceiling - prob) / bucket.MaxRoll
}
