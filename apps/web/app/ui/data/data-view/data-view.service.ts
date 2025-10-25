import { Injectable, computed, inject } from '@angular/core'
import { patchState, signalMethod, signalState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map } from 'rxjs'
import { eqCaseInsensitive } from '~/utils'
import { AgGrid } from '../ag-grid'
import { DataViewAdapter } from './data-view-adapter'
import { DataViewCategory } from './data-view-category'

export type DataViewMode = 'grid' | 'table'
export interface DataViewServiceState<T> {
  agGrid: AgGrid<T> | null
  items: T[]
  categories: DataViewCategory[]
  category: string | null
  categoryItems: T[]
  mode: DataViewMode
  modes: DataViewMode[]
}

@Injectable()
export class DataViewService<T> {
  public readonly adapter: DataViewAdapter<T> = inject(DataViewAdapter<T>)

  private state = signalState<DataViewServiceState<T>>({
    agGrid: null,
    items: null,
    categories: null,
    category: null,
    categoryItems: null,
    mode: 'table',
    modes: ['table', 'grid'],
  })

  public readonly agGrid = this.state.agGrid
  public readonly items = this.state.items
  public readonly categories = this.state.categories
  public readonly category = this.state.category
  public readonly categoryItems = computed(() => {
    return selectItemsByCategory(this.adapter, this.items(), this.category())
  })
  public readonly tableGridOptions = this.adapter.gridOptions()
  public readonly virtualOptions = this.adapter.virtualOptions()

  public readonly isTableSupported = computed(() => {
    return this.state.modes()?.includes('table') && !!this.tableGridOptions
  })

  public readonly isVirtualSupported = computed(() => {
    return this.state.modes()?.includes('grid') && !!this.virtualOptions
  })

  public readonly canToggleMode = computed(() => {
    return this.isTableSupported() && this.isVirtualSupported()
  })

  public readonly mode = computed(() => {
    const mode = this.state.mode()
    if ((!mode || mode === 'table') && !!this.tableGridOptions) {
      return 'table'
    }
    if ((!mode || mode === 'grid') && !!this.virtualOptions) {
      return 'grid'
    }
    return null
  })
  public readonly isTableActive = computed(() => this.mode() === 'table')
  public readonly isGridActive = computed(() => this.mode() === 'grid')

  public readonly onTableReady = (it: AgGrid<T>) => {
    patchState(this.state, { agGrid: it })
  }

  public readonly entityIdGetter = (it: T) => {
    return this.adapter.entityID(it)
  }

  public constructor() {
    this.loadItems(this.adapter.connect())
  }

  public loadCategory = rxMethod<string | null>((category) => {
    return category.pipe(
      map((value) => {
        patchState(this.state, { category: value })
      }),
    )
  })

  public loadItems = rxMethod<T[]>((items) => {
    return items.pipe(
      map((items) => {
        patchState(this.state, {
          items: items,
          categories: selectCategories(this.adapter, items),
        })
      }),
    )
  })

  public toggleMode() {
    if (this.canToggleMode()) {
      patchState(this.state, {
        mode: this.mode() === 'table' ? 'grid' : 'table',
      })
    }
  }

  public setModes = signalMethod<DataViewMode[]>((mode) => {
    patchState(this.state, {
      modes: mode,
      mode: mode?.[0],
    })
  })

  public setCategory = signalMethod<string>((category) => {
    patchState(this.state, {
      category,
    })
  })

  public setMode = signalMethod<DataViewMode>((mode) => {
    patchState(this.state, {
      mode,
    })
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
