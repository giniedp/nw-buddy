import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Damagetable, Vitals, Vitalscategories, Vitalsmetadata } from '@nw-data/types'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { shareReplayRefCount } from '~/utils'

export interface State {
  vitalId: string
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
  public readonly level$ = this.select(this.vital$, (it) => it?.Level)
  public readonly metadata$ = this.select(this.vitalId$, this.db.vitalsMetadataMap, (id, data) => data.get(id))

  public readonly categories$ = this.select(this.vital$, this.db.vitalsCategoriesMap, selectCategories)
  public readonly damageTableNames$ = this.select(this.vitalId$, this.metadata$, selectDamageTableNames)
  public readonly damageTables$ = this.damageTableNames$
    .pipe(switchMap((files) => this.loadDamageTables(files)))
    .pipe(shareReplayRefCount(1))

  public readonly hasDamageTable$ = this.select(this.damageTableNames$, (it) => !!it?.length)
  public constructor(private db: NwDbService) {
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
