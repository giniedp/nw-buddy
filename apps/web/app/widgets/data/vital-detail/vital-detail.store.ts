import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
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
  DamageData,
  StatusEffectData,
  VitalsCategoryData,
  VitalsData,
  VitalsMetadata,
} from '@nw-data/generated'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { selectStream, shareReplayRefCount } from '~/utils'

export interface VitalDetailState {
  vitalId: string
  level?: number
  enableDamage?: boolean
  mutaElementId?: string
  mutaDifficulty?: number
}

export interface DamageTableFile {
  file: string
  rows: DamageData[]
}

@Injectable()
export class VitalDetailStore extends ComponentStore<VitalDetailState> {
  private db = inject(NwDataService)

  readonly vitalId$ = this.select(({ vitalId }) => vitalId)
  readonly vital$ = selectStream(this.db.vital(this.vitalId$))
  readonly creatureType$ = this.select(this.vital$, (it) => it?.CreatureType)
  readonly displayName$ = selectStream(this.vital$, (it) => it?.DisplayName)
  readonly metadata$ = selectStream(this.db.vitalsMeta(this.vitalId$))
  readonly aliasNames$ = selectStream(
    {
      metadata: this.metadata$,
      categories: this.db.vitalsCategoriesMap,
    },
    ({ metadata, categories }) => {
      return metadata?.catIDs?.map((id) => categories.get(id)?.DisplayName)?.filter((it) => it)
    },
  )

  readonly modifier$ = selectStream(this.db.vitalsModifier(this.creatureType$))
  readonly level$ = selectStream(
    {
      vital: this.vital$,
      level: this.select(({ level }) => level),
    },
    ({ vital, level }) => level ?? vital?.Level,
  )
  readonly levelData$ = selectStream(this.db.vitalsLevel(this.level$))
  readonly gearScore$ = selectStream(this.levelData$, (it) => it?.GearScore)

  readonly dungeons$ = selectStream(
    {
      vital: this.vital$,
      dungeons: this.db.gameModes,
      meta: this.db.vitalsMetadataMap,
    },
    ({ vital, dungeons, meta }) => getVitalDungeons(vital, dungeons, meta),
  )
  readonly isVitalFromDungeon$ = this.select(this.dungeons$, (it) => !!it?.length)

  readonly mutaDifficultyId$ = this.select(({ mutaDifficulty }) => mutaDifficulty)
  readonly mutaDifficulty$ = selectStream(this.db.mutatorDifficulty(this.mutaDifficultyId$))

  readonly mutaElementId$ = this.select(({ mutaElementId }) => mutaElementId)
  readonly mutaElement$ = selectStream(this.db.mutatorElement(this.mutaElementId$))
  readonly mutaBuffs$ = this.select(
    combineLatest({
      element: this.mutaElement$,
      buffMap: this.db.buffBucketsMap,
      effectMap: this.db.statusEffectsMap,
      abilitiesMap: this.db.abilitiesMap,
      creatureType: this.creatureType$,
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

  readonly vitalBuffs$ = this.select(
    combineLatest({
      vital: this.vital$,
      buffMap: this.db.buffBucketsMap,
      effectMap: this.db.statusEffectsMap,
      abilitiesMap: this.db.abilitiesMap,
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

  readonly buffs$ = this.select(this.mutaBuffs$, this.vitalBuffs$, (muta, vital) => {
    return [...(muta || []), ...(vital || [])]
  })

  readonly combatCategories$ = this.select(this.vital$, getVitalCategoryInfo)
  readonly categories$ = this.select(this.vital$, this.db.vitalsCategoriesMap, selectCategories)
  readonly damageTableNames$ = this.select(this.vitalId$, this.metadata$, selectDamageTableNames)
  readonly damageTables$ = this.damageTableNames$
    .pipe(switchMap((files) => this.loadDamageTables(files)))
    .pipe(shareReplayRefCount(1))

  readonly damage$ = selectStream(
    {
      vital: this.vital$,
      level: this.levelData$,
      modifier: this.modifier$,
      difficulty: this.mutaDifficulty$,
    },
    ({ vital, modifier, level, difficulty }) => {
      return getVitalDamage({
        vital,
        level,
        damageTable: { DmgCoef: 1, AddDmg: 0 },
        difficulty,
        modifier,
      })
    },
  )
  readonly hasDamageTable$ = this.select(this.damageTableNames$, (it) => !!it?.length)

  readonly health$ = selectStream(
    {
      vital: this.vital$,
      level: this.levelData$,
      modifier: this.modifier$,
      difficulty: this.mutaDifficulty$,
    },
    (data) => getVitalHealth(data),
  )

  readonly armor$ = selectStream(
    {
      vital: this.vital$,
      level: this.levelData$,
    },
    ({ vital, level }) => getVitalArmor(vital, level),
  )

  public constructor() {
    super({
      vitalId: null,
    })
  }

  readonly loadById = this.effect((id$: Observable<string>) => {
    return id$.pipe(map((id) => this.patchState({ vitalId: id })))
  })

  readonly loadMutaDifficulty = this.effect((difficulty$: Observable<number>) => {
    return combineLatest({
      appearsInDungeon: this.isVitalFromDungeon$,
      difficulty: difficulty$,
    }).pipe(
      map(({ appearsInDungeon, difficulty }) => {
        if (!appearsInDungeon) {
          this.patchState({
            mutaDifficulty: null,
            level: null,
          })
        } else {
          this.patchState({
            mutaDifficulty: difficulty,
            level: difficulty ? NW_MAX_ENEMY_LEVEL : null,
          })
        }
      }),
    )
  })

  protected loadDamageTables(files: string[]): Observable<Array<DamageTableFile>> {
    if (!files?.length) {
      return of([])
    }
    return combineLatest(
      files.map((file) => {
        return this.db.data.load<DamageData[]>('datatables/' + file.replace(/\.xml$/, '.json')).pipe(
          map((rows): DamageTableFile => {
            return {
              file: file,
              rows: rows,
            }
          }),
        )
      }),
    )
  }
}

function selectCategories(vital: VitalsData, categories: Map<string, VitalsCategoryData>) {
  return vital.VitalsCategories?.map((id) => categories.get(id))
}

function selectDamageTableNames(id: string, meta: VitalsMetadata) {
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
