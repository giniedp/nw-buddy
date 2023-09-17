import { ColumnApi, ColumnState, GridApi } from '@ag-grid-community/core'
import { EventEmitter, Injectable } from '@angular/core'
import { PreferencesService, StorageNode } from '~/preferences'

@Injectable()
export class DataGridPersistenceService {
  private columnStorage: StorageNode<{ columns?: any; filter?: any }>
  private filterStorage: StorageNode<{ filter?: any }>

  public onFilterApplied = new EventEmitter()
  public onFilterSaved = new EventEmitter()

  public constructor(preferences: PreferencesService) {
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
}
