import { ColumnApi, ColumnState, GridApi } from '@ag-grid-community/core'
import { EventEmitter, Injectable } from '@angular/core'
import { PreferencesService, StorageNode } from '~/preferences'
import { TableGridStore } from './table-grid.store'
import { gridGetPinnedBottomData, gridGetPinnedTopData, gridGetPinnedTopRows } from '../ag-grid/utils'

@Injectable()
export class TableGridPersistenceService {
  private columnStorage: StorageNode<{ columns?: any; pinnedTop?: any; pinnedBottom?: any }>
  private filterStorage: StorageNode<{ filter?: any }>

  public onFilterApplied = new EventEmitter()
  public onFilterSaved = new EventEmitter()

  public constructor(preferences: PreferencesService, protected store: TableGridStore<any>) {
    this.columnStorage = preferences.storage.storageScope('grid:')
    this.filterStorage = preferences.session.storageScope('grid:')
  }

  public async resetColumnState(api: ColumnApi, key: string) {
    if (!api || !key) {
      return
    }
    api.resetColumnState()
    this.writeColumnState(api, key, null)
  }

  public async saveColumnState(api: ColumnApi, key: string) {
    if (!api) {
      return
    }
    const state = api.getColumnState()
    this.writeColumnState(api, key, state)
  }

  private writeColumnState(api: ColumnApi, key: string, state: ColumnState[]) {
    if (!key || !api) {
      return
    }
    if (state?.length) {
      this.columnStorage.set(key, {
        ...(this.columnStorage.get(key) || {}),
        columns: state,
      })
    } else {
      this.columnStorage.delete(key)
    }
  }

  public async saveFilterState(api: GridApi, key: string) {
    if (!api || !key) {
      return
    }
    const filterState = api.getFilterModel()
    this.filterStorage.set(key, {
      filter: filterState,
    })
    this.onFilterSaved.next(filterState)
  }

  public loadColumnState(api: ColumnApi, key: string) {
    if (!key || !api) {
      return
    }

    const data = this.columnStorage.get(key)?.columns
    if (data) {
      api.applyColumnState({ state: data, applyOrder: true })
    }
  }

  public loadFilterState(api: GridApi, key: string) {
    const data = this.filterStorage.get(key)?.filter
    this.applyFilterState(api, data)
  }

  public applyFilterState(api: GridApi, filter: any) {
    if (filter && api) {
      api.setFilterModel(filter)
      this.onFilterApplied.next(filter)
    }
  }

  public loadPinnedState(api: GridApi, key: string, identify: (item: any) => string | number) {
    if (!key || !api || !identify) {
      return
    }
    const state = this.columnStorage.get(key)
    const pinnedTop = resolvePinnedData(api, state?.pinnedTop, identify) || []
    const pinnedBottom = resolvePinnedData(api, state?.pinnedBottom, identify) || []
    api.setPinnedTopRowData(pinnedTop)
    api.setPinnedBottomRowData(pinnedBottom)
  }

  public savePinnedState(api: GridApi, key: string, identify: (item: any) => string | number) {
    if (!key || !api || !identify) {
      return
    }
    const pinnedTop = gridGetPinnedTopData(api)?.map(identify)
    const pinnedBottom = gridGetPinnedBottomData(api)?.map(identify)
    this.columnStorage.set(key, {
      ...(this.columnStorage.get(key) || {}),
      pinnedTop: pinnedTop,
      pinnedBottom: pinnedBottom,
    })
  }
}

function resolvePinnedData(api: GridApi, ids: Array<string | number>, identify: (item: any) => string | number) {
  if (!Array.isArray(ids) || !ids?.length) {
    return null
  }
  const result: any[] = []
  api.forEachNode(({ data }) => {
    if (ids.includes(identify(data))) {
      result.push(data)
    }
  })
  return result
}
