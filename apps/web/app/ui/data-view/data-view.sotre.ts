import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { isEqual } from 'lodash'
import { switchMap } from 'rxjs'
import { eqCaseInsensitive, selectStream } from '~/utils'
import { DataViewAdapter } from './data-view-adapter'
import { DataViewCategory } from './data-view-category'
import { DataTableSource } from '../data-grid'

export interface DataViewState<T> {
  adapter?: DataViewAdapter<T>
  selectedCategory?: string | number
  selectedItems?: Array<string | number>
  multiSelect?: boolean
  activeView?: 'grid' | 'virtual'
}

@Injectable()
export class DataViewStore<T = unknown> extends ComponentStore<DataViewState<T>> {
  public readonly adapter$ = this.select(({ adapter }) => adapter)
  public readonly activeView$ = this.selectSignal(({ activeView }) => activeView)
  public readonly gridSource$ = this.select(this.adapter$, toGridSource)
  public readonly virtualOption$ = this.select(this.adapter$, (it) => it.gridOptions())
  public readonly selectedCategoryId$ = this.select(({ selectedCategory }) => selectedCategory)
  public readonly selectedItemIds$ = this.select(({ selectedItems }) => selectedItems, { equal: isEqual })

  public readonly source$ = selectStream(this.adapter$.pipe(switchMap((it) => it.connect())))
  public readonly categories$ = this.select(this.adapter$, this.source$, selectCategories)
  public readonly data$ = this.select(this.adapter$, this.source$, this.selectedCategoryId$, selectItemsByCategory)
  // public readonly filterParam$ = this.select(({ filterParam }) => filterParam)
  // public readonly selectionParam$ = this.select(({ selectionParam }) => selectionParam)

  public constructor() {
    super({})
  }
}

function selectItemsByCategory<T>(adapter: DataViewAdapter<T>, items: T[], category: string) {
  if (!adapter || !category || !items) {
    return items
  }
  return items.filter((it) =>
    adapter.entityCategories(it)?.some((cat) => eqCaseInsensitive(String(cat.id), String(category)))
  )
}

function selectCategories<T>(adapter: DataViewAdapter<T>, entities: T[]) {
  const result = new Map<string, DataViewCategory>()
  for (const item of entities) {
    if (!item) {
      continue
    }
    const categories = adapter.entityCategories(item)
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

function toGridSource<T>(source: DataViewAdapter<T>): DataTableSource<T> {
  return {
    entityID: (item) => source.entityID(item),
    entityCategories: (item) => source.entityCategories(item),
    gridOptions: () => source.gridOptions(),
    connect: () => source.connect(),
  }
}
