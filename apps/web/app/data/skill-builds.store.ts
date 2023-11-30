import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Ability } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest, distinctUntilChanged, filter, switchMap } from 'rxjs'
import { NwDbService } from '~/nw/nw-db.service'
import { eqCaseInsensitive, selectStream } from '~/utils'
import { SkillBuildRecord, SkillBuildsDB } from './skill-builds.db'

export interface SkillBuildsState {
  isLoaded?: boolean
  records: SkillBuildRecord[]
  abilities: Map<string, Ability>
  selectedTags?: string[]
}

export interface SkillBuildRow {
  /**
   * The player item stored in database
   */
  record: SkillBuildRecord
  abilities: Ability[]
}

@Injectable({ providedIn: 'root' })
export class SkillBuildsStore extends ComponentStore<SkillBuildsState> {
  public readonly isLoaded$ = this.select(({ isLoaded }) => isLoaded)
  public readonly records$ = this.select(({ records }) => records)
  public readonly recordsTags$ = this.select(this.records$, selectAllTags)
  public readonly abilities$ = this.select(({ abilities }) => abilities)

  public readonly selectedTags$ = this.select(({ selectedTags }) => selectedTags)
  public readonly selectedRecords$ = selectStream(
    {
      records: this.records$,
      tags: this.selectedTags$,
    },
    ({ records, tags }) => selectRecordsHavingTags(records, tags),
  )

  public readonly rows$ = this.select(({ abilities, records }) => records?.map((it) => this.buildRow(abilities, it)))
  public readonly selectedRows$ = selectStream(
    {
      records: this.selectedRecords$,
      abilities: this.abilities$,
    },
    ({ records, abilities }) => records?.map((it) => this.buildRow(abilities, it)),
  )

  public readonly tags$ = this.select(this.recordsTags$, this.selectedTags$, selectTags)
  public readonly whenLoaded$ = this.isLoaded$.pipe(filter((it) => !!it)).pipe(distinctUntilChanged())

  public constructor(
    private db: SkillBuildsDB,
    private nwdb: NwDbService,
  ) {
    super({
      isLoaded: false,
      records: null,
      abilities: null,
    })
    this.loadAll()
  }

  public loadAll() {
    this.loadItems(
      combineLatest({
        records: this.db.observeAll(),
        abilities: this.nwdb.abilitiesMap,
      }),
    )
  }

  public readonly loadItems = this.updater((state, update: SkillBuildsState) => {
    return {
      ...state,
      ...update,
      isLoaded: true,
    }
  })

  public async createRecord({ record }: { record: SkillBuildRecord }) {
    return this.db.create(record).catch(console.error)
  }

  public readonly updateRecord = this.effect<{ record: SkillBuildRecord }>((value$) => {
    return value$.pipe(
      switchMap(async ({ record }) => {
        await this.db.update(record.id, record).catch(console.error)
      }),
    )
  })

  public readonly destroyRecord = this.effect<{ recordId: string }>((value$) => {
    return value$.pipe(
      switchMap(async ({ recordId }) => {
        await this.db.destroy(recordId).catch(console.error)
      }),
    )
  })

  public buildRow(abilities: Map<string, Ability>, record: SkillBuildRecord): SkillBuildRow {
    if (!record) {
      return null
    }
    return {
      record: record,
      abilities: [...(record.tree1 || []), ...(record.tree2 || [])]
        .map((it) => abilities?.get(it))
        .filter((it) => it?.IsActiveAbility),
    }
  }

  public toggleTag(value: string) {
    const tags = [...(this.state().selectedTags || [])]
    const index = tags.findIndex((tag) => eqCaseInsensitive(tag, value))
    if (index >= 0) {
      tags.splice(index, 1)
    } else {
      tags.push(value)
    }
    this.patchState({ selectedTags: tags })
  }
}

function selectAllTags(records: SkillBuildRecord[]) {
  return uniq((records || []).map((it) => it.tags || []).flat())
}

function selectRecordsHavingTags(records: SkillBuildRecord[], selectedTags: string[]) {
  if (!selectedTags?.length) {
    return records
  }
  return records?.filter(({ tags }) => {
    if (!tags?.length) {
      return false
    }
    return tags.some((tag) => {
      return tag && selectedTags.some((it) => eqCaseInsensitive(tag, it))
    })
  })
}

function selectTags(tags: string[], selectedTags: string[]) {
  return (tags || []).sort().map((tag) => {
    return {
      tag: tag,
      active: selectedTags?.some((it) => eqCaseInsensitive(it, tag)),
    }
  })
}
