import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { isEqual } from 'lodash'
import { defer, switchMap } from 'rxjs'
import { eqCaseInsensitive, selectStream } from '~/utils'
import { AgGrid } from '../ag-grid'
import { DataGridSource } from './data-grid-source'
import { DataGridCategory } from './types'

export interface DataGridState<T> {
  source?: DataGridSource<T>
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
  public readonly grid$ = this.select(({ grid }) => grid)
  public readonly source$ = this.select(({ source }) => source)
  public readonly items$ = selectStream(this.source$.pipe(switchMap((it) => it.connect())))
  public readonly categories$ = selectStream(
    {
      source: this.source$,
      items: this.items$,
    },
    ({ source, items }) => selectCategories(source, items)
  )
  public readonly gridOptions$ = selectStream(this.source$, (it) => it.buildOptions())
  public readonly gridData$ = selectStream(
    {
      source: this.source$,
      items: this.items$,
      category: defer(() => this.selectedCategoryId$),
    },
    selectItemsByCategory
  )

  public readonly filterParam$ = this.select(({ filterParam }) => filterParam)
  public readonly selectionParam$ = this.select(({ selectionParam }) => selectionParam)
  public readonly selectedCategoryId$ = this.select(({ selectedCategory }) => selectedCategory)
  public readonly selectedItemIds$ = this.select(({ selectedItems }) => selectedItems, { equal: isEqual })

  public constructor() {
    super({})
  }
}

function selectItemsByCategory<T>({
  source,
  items,
  category,
}: {
  source: DataGridSource<T>
  items: T[]
  category: string
}) {
  if (!source || !category || !items) {
    return items
  }
  return items.filter((it) =>
    source.entityCategories(it)?.some((cat) => eqCaseInsensitive(String(cat.id), String(category)))
  )
}

function selectCategories<T>(source: DataGridSource<T>, entities: T[]) {
  const result = new Map<string, DataGridCategory>()
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
