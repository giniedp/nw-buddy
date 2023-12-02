import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { BuffBucket, getVitalArmor, getVitalHealth } from '@nw-data/common'
import {
  Ability,
  Damagetable,
  Elementalmutations,
  Statuseffect,
  Vitals,
  Vitalscategories,
  Vitalsmetadata,
} from '@nw-data/generated'
import { uniqBy } from 'lodash'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
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
  private db = inject(NwDbService)
  readonly vitalId$ = this.select(({ vitalId }) => vitalId)
  readonly vital$ = selectStream(this.db.vital(this.vitalId$))
  readonly creatureType$ = this.select(this.vital$, (it) => it?.CreatureType)
  readonly metadata$ = selectStream(this.db.vitalsMeta(this.vitalId$))
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

  readonly mutaDifficultyId$ = this.select(({ mutaDifficulty }) => mutaDifficulty)
  readonly mutaDifficulty$ = this.select(this.db.mutatorDifficulty(this.mutaDifficultyId$), (it) => it)

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

  readonly categories$ = this.select(this.vital$, this.db.vitalsCategoriesMap, selectCategories)
  readonly damageTableNames$ = this.select(this.vitalId$, this.metadata$, selectDamageTableNames)
  readonly damageTables$ = this.damageTableNames$
    .pipe(switchMap((files) => this.loadDamageTables(files)))
    .pipe(shareReplayRefCount(1))

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

function selectDamageTableNames(id: string, meta: Vitalsmetadata) {
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
