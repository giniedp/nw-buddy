import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, map, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { LootTableEntry } from '~/nw/utils'
import { CaseInsensitiveSet } from '~/utils'

export interface LootTableListState {
  tableIds: string[]
  highlight: string[]
}

@Injectable()
export class LootTableListStore extends ComponentStore<LootTableListState> {
  public readonly tableIds$ = this.select(({ tableIds }) => tableIds)
  public readonly highlight$ = this.select(({ highlight }) => highlight)
  public readonly tablesWithoutParent$ = this.db.lootTables.pipe(map((it) => getEntriesWithout(it)))
  public readonly tablesSelected$ = combineLatest({
    tables: this.db.lootTablesMap,
    ids: this.tableIds$,
  }).pipe(map(({ tables, ids }) => ids.map((id) => tables.get(id))))

  public readonly rootTables$ = this.tableIds$.pipe(
    switchMap((ids) => (ids ? this.tablesSelected$ : this.tablesWithoutParent$))
  )

  public constructor(private db: NwDbService) {
    super({
      tableIds: null,
      highlight: null,
    })
  }

  public setTables = this.updater((state, tableIds: string[]) => {
    return {
      ...state,
      tableIds: tableIds,
    }
  })

  public setHighlight = this.updater((state, highlight: string[]) => {
    return {
      ...state,
      highlight: highlight,
    }
  })
}

function getEntriesWithout(entries: LootTableEntry[]) {
  const idsWithParent = new CaseInsensitiveSet()
  for (const entry of entries) {
    for (const item of entry.Items || []) {
      if (item.LootTableID) {
        idsWithParent.add(item.LootTableID)
      }
    }
  }

  return entries.filter((it) => !idsWithParent.has(it.LootTableID))
}
