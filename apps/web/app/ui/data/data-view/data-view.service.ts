import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Observable, map } from 'rxjs'
import { eqCaseInsensitive } from '~/utils'
import { DataViewAdapter } from './data-view-adapter'
import { DataViewCategory } from './data-view-category'

export type DataViewMode = 'grid' | 'virtual'
export interface DataViewServiceState<T> {
  items: T[]
  categories: DataViewCategory[]
  category: string | null
  categoryItems: T[]
  mode: DataViewMode
}

@Injectable()
export class DataViewService<T> extends ComponentStore<DataViewServiceState<T>> {
  public readonly items$ = this.select(({ items }) => items)
  public readonly categories$ = this.select(({ categories }) => categories)
  public readonly category$ = this.select(({ category }) => category)
  public readonly categoryItems$ = this.select(this.items$, this.category$, (items, category) => {
    return selectItemsByCategory(this.adapter, items, category)
  })

  public readonly gridOptions = this.adapter.gridOptions()
  public readonly virtualOptions = this.adapter.virtualOptions()
  public readonly canToggleMode = !!this.gridOptions && !!this.virtualOptions
  public readonly mode$ = this.selectSignal(({ mode }) => {
    if ((!mode || mode === 'grid') && !!this.gridOptions) {
      return 'grid'
    }
    if ((!mode || mode === 'virtual') && !!this.gridOptions) {
      return 'virtual'
    }
    return null
  })
  public readonly isGridActive$ = this.selectSignal(this.mode$, (mode) => mode === 'grid')
  public readonly isVirtGridActive$ = this.selectSignal(this.mode$, (mode) => mode === 'virtual')

  public readonly entityIdGetter = (it: T) => {
    return this.adapter.entityID(it)
  }

  public constructor(public readonly adapter: DataViewAdapter<T>) {
    super({
      items: [],
      categories: [],
      category: null,
      categoryItems: [],
      mode: 'grid',
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
      this.patchState({ mode: this.mode$() === 'grid' ? 'virtual' : 'grid' })
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
