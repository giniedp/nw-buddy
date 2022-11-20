import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Ability } from '@nw-data/types'
import { combineLatest, defer, distinctUntilChanged, filter, of, Subject, switchMap, tap } from 'rxjs'
import { NwDbService } from '~/nw/nw-db.service'
import { AttributeName } from '~/widgets/attributes-editor'

import { SkillBuildRecord, SkillBuildsDB } from './skill-builds.db'

export interface SkillBuildsState {
  isLoaded?: boolean
  records: SkillBuildRecord[]
  abilities: Map<string, Ability>
}

export interface SkillBuildRow {
  /**
   * The player item stored in database
   */
  record: SkillBuildRecord
  abilities: Ability[]
}

@Injectable()
export class SkillBuildsStore extends ComponentStore<SkillBuildsState> {
  public readonly isLoaded$ = this.select(({ isLoaded }) => isLoaded)
  public readonly records$ = this.select(({ records }) => records)
  public readonly rows$ = this.select(({ abilities, records }) => records?.map((it) => this.buildRow(abilities, it)))
  public readonly whenLoaded$ = this.isLoaded$.pipe(filter((it) => !!it)).pipe(distinctUntilChanged())

  public rowCreated$ = defer(() => this.rowCreated)
  public rowUpdated$ = defer(() => this.rowUpdated)
  public rowDestroyed$ = defer(() => this.rowDestroyed)

  private rowCreated = new Subject<SkillBuildRow>()
  private rowUpdated = new Subject<SkillBuildRow>()
  private rowDestroyed = new Subject<string>()

  public constructor(private db: SkillBuildsDB, private nwdb: NwDbService) {
    super({
      isLoaded: false,
      records: null,
      abilities: null
    })
    this.loadAll()
  }

  public loadAll() {
    this.loadItems(
      combineLatest({
        records: this.db.observeAll(),
        abilities: this.nwdb.abilitiesMap
      })
    )
  }

  public readonly loadItems = this.updater((state, update: SkillBuildsState) => {
    return {
      ...state,
      ...update,
      isLoaded: true
    }
  })

  public readonly createRecord = this.effect<{ record: SkillBuildRecord }>((value$) => {
    return value$.pipe(
      switchMap(async ({ record }) => {
        await this.db
          .create(record)
          .then((created) => this.rowCreated.next(this.buildRow(this.get().abilities, created)))
          .catch(console.error)
      })
    )
  })

  public readonly updateRecord = this.effect<{ record: SkillBuildRecord }>((value$) => {
    return value$.pipe(
      switchMap(async ({ record }) => {
        await this.db
          .update(record.id, record)
          .then((updated) => this.rowUpdated.next(this.buildRow(this.get().abilities, updated)))
          .catch(console.error)
      })
    )
  })

  public readonly destroyRecord = this.effect<{ recordId: string }>((value$) => {
    return value$.pipe(
      switchMap(async ({ recordId }) => {
        await this.db
          .destroy(recordId)
          .then(() => this.rowDestroyed.next(recordId))
          .catch(console.error)
      })
    )
  })

  public buildRow(abilities: Map<string, Ability>, record: SkillBuildRecord): SkillBuildRow {

    if (!record) {
      return null
    }


    return {
      record: record,
      abilities:  [
        ...(record.tree1 || []),
        ...(record.tree2 || []),
      ]
      .map((it) => abilities?.get(it))
      .filter((it) => it?.IsActiveAbility)
    }
  }
}
