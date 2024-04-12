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
  Ability,
  Damagetable,
  Elementalmutations,
  Statuseffect,
  Vitals,
  Vitalscategories,
  VitalsMetadata,
} from '@nw-data/generated'
import { uniqBy } from 'lodash'
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
  rows: Damagetable[]
}

@Injectable()
export class VitalDetailStore extends ComponentStore<VitalDetailState> {
  private db = inject(NwDataService)

  readonly vitalId$ = this.select(({ vitalId }) => vitalId)
  readonly vital$ = selectStream(this.db.vital(this.vitalId$))
  readonly creatureType$ = this.select(this.vital$, (it) => it?.CreatureType)
  readonly displayName$ = selectStream(this.vital$, (it) => it?.DisplayName)
  readonly metadata$ = selectStream(this.db.vitalsMeta(this.vitalId$))
  readonly aliasNames$ = selectStream({
    metadata: this.metadata$,
    categories: this.db.vitalsCategoriesMap,
  }, ({ metadata, categories }) => {
    return metadata?.catIDs?.map((id) => categories.get(id)?.DisplayName)?.filter((it) => it)
  })

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
    (data) => selectBuffs(data),
  )

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
        return this.db.data.load<Damagetable[]>(file.replace(/\.xml$/, '.json')).pipe(
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

function selectCategories(vital: Vitals, categories: Map<string, Vitalscategories>) {
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

function selectBuffs({
  element,
  buffMap,
  effectMap,
  abilitiesMap,
  creatureType,
}: {
  element: Elementalmutations
  buffMap: Map<string, BuffBucket>
  effectMap: Map<string, Statuseffect>
  abilitiesMap: Map<string, Ability>
  creatureType: string
}) {
  const statusEffects: Array<Statuseffect> = []
  const abilities: Array<Ability> = []

  function collect(bucket: BuffBucket) {
    if (!bucket) {
      return
    }
    for (const buff of bucket.Buffs) {
      if (buff.BuffType === 'StatusEffect') {
        statusEffects.push(effectMap.get(buff.Buff))
        continue
      }
      if (buff.BuffType === 'BuffBucket') {
        collect(buffMap.get(buff.Buff))
        continue
      }
      if (buff.BuffType === 'Ability') {
        abilities.push(abilitiesMap.get(buff.Buff))
        continue
      }
      if (buff.BuffType === 'Promotion') {
        continue
      }
    }
  }
  collect(buffMap.get(element?.[creatureType]))

  if (!statusEffects.length && !abilities.length) {
    return null
  }

  return {
    effects: uniqBy(statusEffects, 'StatusID'),
    abilities: uniqBy(abilities, 'AbilityID'),
  }
}
