import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Observable, map, of } from 'rxjs'
import { eqCaseInsensitive } from '~/utils'
import { DataViewAdapter } from './data-view-adapter'
import { DataViewCategory } from './data-view-category'
import { AgGrid, whenGridReady } from '../ag-grid'
import { AgGridEvent } from '@ag-grid-community/core'

export type DataViewMode = 'grid' | 'table'
export interface DataViewServiceState<T> {
  agGrid?: AgGrid<T> | null
  items: T[]
  categories: DataViewCategory[]
  category: string | null
  categoryItems: T[]
  mode: DataViewMode
}

@Injectable()
export class DataViewService<T> extends ComponentStore<DataViewServiceState<T>> {
  public readonly agGrid$ = this.select(({ agGrid }) => agGrid)
  public readonly items$ = this.select(({ items }) => items)
  public readonly categories$ = this.select(({ categories }) => categories)
  public readonly category$ = this.select(({ category }) => category)
  public readonly categoryItems$ = this.select(this.items$, this.category$, (items, category) => {
    return selectItemsByCategory(this.adapter, items, category)
  })

  public readonly tableGridOptions = this.adapter.gridOptions()
  public readonly virtualOptions = this.adapter.virtualOptions()
  public readonly canToggleMode = !!this.tableGridOptions && !!this.virtualOptions
  public readonly mode$ = this.selectSignal(({ mode }) => {
    if ((!mode || mode === 'table') && !!this.tableGridOptions) {
      return 'table'
    }
    if ((!mode || mode === 'grid') && !!this.tableGridOptions) {
      return 'grid'
    }
    return null
  })
  public readonly isTableActive$ = this.selectSignal(this.mode$, (mode) => mode === 'table')
  public readonly isGridActive$ = this.selectSignal(this.mode$, (mode) => mode === 'grid')

  public readonly onTableReady = (it: AgGrid<T>) => {
    return this.patchState({ agGrid: it })
  }

  public readonly entityIdGetter = (it: T) => {
    return this.adapter.entityID(it)
  }

  public constructor(public readonly adapter: DataViewAdapter<T>) {
    super({
      items: [],
      categories: [],
      category: null,
      categoryItems: [],
      mode: 'table',
    })

    this.loadItems(adapter.connect())
  }

  public loadCateory = this.effect((category: Observable<string | null>) => {
    return category.pipe(
      map((value) => {
        this.patchState({ category: value })
      })
    )
  })

  public loadItems = this.effect((items: Observable<T[]>) => {
    return items.pipe(
      map((items) => {
        this.patchState({
          items: items,
          categories: selectCategories(this.adapter, items),
        })
      })
    )
  })

  public toggleMode() {
    if (this.canToggleMode) {
      this.patchState({ mode: this.mode$() === 'table' ? 'grid' : 'table' })
    }
  }
}

function selectCategories<T>(adapter: DataViewAdapter<T>, items: T[]) {
  const result = new Map<string, DataViewCategory>()

  if (adapter.getCategories) {
    adapter.getCategories()?.forEach((category) => {
      result.set(category.id, category)
    })
    return Array.from(result.values())
  }

  for (const item of items) {
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

function selectItemsByCategory<T>(adapter: DataViewAdapter<T>, items: T[], category: string | number | null) {
  if (!adapter || !category || !items) {
    return items
  }
  return items.filter((it) =>
    adapter.entityCategories(it)?.some((cat) => eqCaseInsensitive(String(cat.id), String(category)))
  )
}
