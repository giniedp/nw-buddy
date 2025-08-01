import { Injectable, afterNextRender } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ComponentStore } from '@ngrx/component-store'
import { Observable, map } from 'rxjs'
import { eqCaseInsensitive } from '~/utils'
import { AgGrid } from '../ag-grid'
import { DataViewAdapter } from './data-view-adapter'
import { DataViewCategory } from './data-view-category'

export type DataViewMode = 'grid' | 'table'
export interface DataViewServiceState<T> {
  agGrid?: AgGrid<T> | null
  items: T[]
  categories: DataViewCategory[]
  category: string | null
  categoryItems: T[]
  mode: DataViewMode
  modes: DataViewMode[]
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

  public readonly categoryItems = toSignal(this.categoryItems$)
  public readonly tableGridOptions = this.adapter.gridOptions()
  public readonly virtualOptions = this.adapter.virtualOptions()

  public readonly isTableSupported = this.selectSignal(({ modes }) => {
    return modes?.includes('table') && !!this.tableGridOptions
  })
  public readonly isVirtualSupported = this.selectSignal(({ modes }) => {
    return modes?.includes('grid') && !!this.virtualOptions
  })

  public readonly canToggleMode = this.selectSignal(this.isTableSupported, this.isVirtualSupported, (table, grid) => {
    return table && grid
  })

  public readonly mode$ = this.selectSignal(({ mode }) => {
    if ((!mode || mode === 'table') && !!this.tableGridOptions) {
      return 'table'
    }
    if ((!mode || mode === 'grid') && !!this.virtualOptions) {
      return 'grid'
    }
    return null
  })
  public readonly isTableActive = this.selectSignal(this.mode$, (mode) => mode === 'table')
  public readonly isGridActive = this.selectSignal(this.mode$, (mode) => mode === 'grid')

  public readonly onTableReady = (it: AgGrid<T>) => {
    return this.patchState({ agGrid: it })
  }

  public readonly entityIdGetter = (it: T) => {
    return this.adapter.entityID(it)
  }

  public constructor(public readonly adapter: DataViewAdapter<T>) {
    super({
      items: null,
      categories: null,
      category: null,
      categoryItems: null,
      mode: 'table',
      modes: ['table', 'grid'],
    })
    setTimeout(() => {
      this.loadItems(adapter.connect())
    })
  }

  public loadCategory = this.effect((category: Observable<string | null>) => {
    return category.pipe(
      map((value) => {
        this.patchState({ category: value })
      }),
    )
  })

  public loadItems = this.effect((items: Observable<T[]>) => {
    return items.pipe(
      map((items) => {
        this.patchState({
          items: items,
          categories: selectCategories(this.adapter, items),
        })
      }),
    )
  })

  public toggleMode() {
    if (this.canToggleMode()) {
      this.patchState({ mode: this.mode$() === 'table' ? 'grid' : 'table' })
    }
  }

  public setMode = this.updater<DataViewMode[]>((state, mode) => {
    return {
      ...state,
      modes: mode,
      mode: mode?.[0],
    }
  })
}

function selectCategories<T>(adapter: DataViewAdapter<T>, items: T[]) {
  if (!items) {
    return []
  }
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
    adapter.entityCategories(it)?.some((cat) => eqCaseInsensitive(String(cat.id), String(category))),
  )
}
