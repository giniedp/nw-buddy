import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { BuffBucket } from '@nw-data/common'
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
import { ModelViewerService } from '../model-viewer'

export interface State {
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
export class VitalDetailStore extends ComponentStore<State> {

  public readonly vitalId$ = this.select(({ vitalId }) => vitalId)
  public readonly vital$ = this.select(this.db.vital(this.vitalId$), (it) => it)

  public readonly levelOverride$ = this.select(({ level }) => level)
  public readonly level$ = this.select(this.vital$, this.levelOverride$, (vital, level) => level ?? vital?.Level)
  public readonly vitalLevel$ = this.select(this.db.vitalsLevel(this.level$), (it) => it)

  public readonly creatureTypeId$ = this.select(this.vital$, (it) => it?.CreatureType)
  public readonly vitalModifier$ = this.select(this.db.vitalsModifier(this.creatureTypeId$), (it) => it)

  public readonly mutaElementId$ = this.select(({ mutaElementId }) => mutaElementId)
  public readonly mutaElement$ = this.select(this.db.mutatorElement(this.mutaElementId$), (it) => it)
  public readonly mutaBuffs$ = this.select(
    combineLatest({
      element: this.mutaElement$,
      buffMap: this.db.buffBucketsMap,
      effectMap: this.db.statusEffectsMap,
      abilitiesMap: this.db.abilitiesMap,
      creatureType: this.creatureTypeId$,
    }),
    (data) => selectBuffs(data)
  )

  public readonly mutaDifficultyId$ = this.select(({ mutaDifficulty }) => mutaDifficulty)
  public readonly mutaDifficulty$ = this.select(this.db.mutatorDifficulty(this.mutaDifficultyId$), (it) => it)

  public readonly metadata$ = this.select(this.vitalId$, this.db.vitalsMetadataMap, (id, data) => data.get(id))
  public readonly modelFiles$ = this.select(this.vs.byVitalsId(this.vitalId$), (it) => it)

  public readonly categories$ = this.select(this.vital$, this.db.vitalsCategoriesMap, selectCategories)
  public readonly damageTableNames$ = this.select(this.vitalId$, this.metadata$, selectDamageTableNames)
  public readonly damageTables$ = this.damageTableNames$
    .pipe(switchMap((files) => this.loadDamageTables(files)))
    .pipe(shareReplayRefCount(1))

  public readonly hasDamageTable$ = this.select(this.damageTableNames$, (it) => !!it?.length)

  public totalHP$ = selectStream({
    vital: this.vital$,
    mods: this.vitalModifier$,
    levels: this.vitalLevel$,
    difficulty: this.mutaDifficulty$,
  }, ({ vital, mods, levels, difficulty }) => {
    const potency = 1 + (difficulty?.[`HealthPotency_${vital.CreatureType}`] || 0) / 100
    return Math.floor(levels.BaseMaxHealth * vital.HealthMod * mods.CategoryHealthMod * potency)
  })

  public constructor(private db: NwDbService, private vs: ModelViewerService) {
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
          })
        )
      })
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
