import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Damagetable, Vitals, Vitalscategories, Vitalsmetadata } from '@nw-data/generated'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { shareReplayRefCount } from '~/utils'
import { ModelViewerService } from '../model-viewer'

export interface State {
  vitalId: string
  level?: number
  enableDamage?: boolean
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

  public readonly metadata$ = this.select(this.vitalId$, this.db.vitalsMetadataMap, (id, data) => data.get(id))
  public readonly modelFiles$ = this.select(this.vs.byVitalsId(this.vitalId$), (it) => it)

  public readonly categories$ = this.select(this.vital$, this.db.vitalsCategoriesMap, selectCategories)
  public readonly damageTableNames$ = this.select(this.vitalId$, this.metadata$, selectDamageTableNames)
  public readonly damageTables$ = this.damageTableNames$
    .pipe(switchMap((files) => this.loadDamageTables(files)))
    .pipe(shareReplayRefCount(1))

  public readonly hasDamageTable$ = this.select(this.damageTableNames$, (it) => !!it?.length)
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
