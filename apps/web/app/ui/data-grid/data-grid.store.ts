import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { isEqual } from 'lodash'
import { switchMap } from 'rxjs'
import { eqCaseInsensitive, selectStream } from '~/utils'
import { AgGrid } from '../ag-grid'
import { DataTableSource } from './data-table-source'
import { DataTableCategory } from './types'

export interface DataGridState<T> {
  source?: DataTableSource<T>
  grid?: AgGrid<T>

  selectedCategory?: string | number
  selectedItems?: Array<string | number>
  selectionParam?: string

  multiSelect?: boolean
  filterModel?: any
  filterParam?: string
}

@Injectable()
export class DataGridStore<T = unknown> extends ComponentStore<DataGridState<T>> {
  public readonly filterParam$ = this.select(({ filterParam }) => filterParam)
  public readonly selectionParam$ = this.select(({ selectionParam }) => selectionParam)
  public readonly selectedCategoryId$ = this.select(({ selectedCategory }) => selectedCategory)
  public readonly selectedItemIds$ = this.select(({ selectedItems }) => selectedItems, { equal: isEqual })

  public readonly grid$ = this.select(({ grid }) => grid)
  public readonly source$ = this.select(({ source }) => source)
  public readonly items$ = selectStream(this.source$.pipe(switchMap((it) => it.connect())))
  public readonly categories$ = this.select(this.source$, this.items$, selectCategories)
  public readonly gridOptions$ = this.select(this.source$, (it) => it.gridOptions())
  public readonly gridData$ = this.select(this.source$, this.items$, this.selectedCategoryId$, selectItemsByCategory)

  public constructor() {
    super({})
  }
}

function selectItemsByCategory<T>(source: DataTableSource<T>, items: T[], category: string) {
  if (!source || !category || !items) {
    return items
  }
  return items.filter((it) =>
    source.entityCategories(it)?.some((cat) => eqCaseInsensitive(String(cat.id), String(category)))
  )
}

function selectCategories<T>(source: DataTableSource<T>, entities: T[]) {
  const result = new Map<string, DataTableCategory>()
  for (const item of entities) {
    if (!item) {
      continue
    }
    const categories = source.entityCategories(item)
    if (!categories) {
      continue
    }
    for (const category of categories) {
      if (category && !result.has(category.id)) {
        result.set(category.id, category)
      }
    }
  }
  return Array.from(result.values())
}
