import { ColumnState, GridApi } from '@ag-grid-community/core'
import { EventEmitter, Injectable, inject } from '@angular/core'
import { TableStateDB, TableStateRecord } from '~/data'
import { PreferencesService, StorageNode } from '~/preferences'
import { gridGetPinnedBottomData, gridGetPinnedTopData } from '../ag-grid/utils'

@Injectable()
export class TableGridPersistenceService {
  private storage = inject(TableStateDB)
  private filterStorage: StorageNode<{ filter: unknown }> = inject(PreferencesService).session.storageScope('grid:')

  public onFilterApplied = new EventEmitter()
  public onFilterSaved = new EventEmitter()

  public async resetColumnState(api: GridApi, key: string) {
    if (!api || !key) {
      return
    }
    api.resetColumnState()
    this.writeColumnState(api, key, null)
  }

  public async saveColumnState(api: GridApi, key: string) {
    if (!api) {
      return
    }
    const state = api.getColumnState()
    this.writeColumnState(api, key, state)
  }

  private async writeColumnState(api: GridApi, key: string, state: ColumnState[]) {
    if (!key || !api) {
      return
    }
    const current = await this.storage.read(key).catch(() => null as TableStateRecord)
    await this.storage
      .createOrUpdate({
        pinnedBottom: null,
        pinnedTop: null,
        ...(current || {}),
        id: key,
        columns: state?.length ? state : null,
      })
      .catch(console.error)
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

  public async loadColumnState(api: GridApi, key: string) {
    if (!key || !api) {
      return
    }

    const current = await this.storage.read(key).catch(() => null as TableStateRecord)
    const data = current?.columns
    if (data) {
      api.applyColumnState({ state: data, applyOrder: true })
    }
  }

  public async loadFilterState(api: GridApi, key: string) {
    const data = this.filterStorage.get(key)?.filter
    this.applyFilterState(api, data)
  }

  public applyFilterState(api: GridApi, filter: any) {
    if (filter && api) {
      api.setFilterModel(filter)
      this.onFilterApplied.next(filter)
    }
  }

  public async loadPinnedState(api: GridApi, key: string, identify: (item: any) => string | number) {
    if (!key || !api || !identify) {
      return
    }
    const state = await this.storage.read(key).catch(() => null as TableStateRecord)
    const pinnedTop = resolvePinnedData(api, state?.pinnedTop, identify) || []
    const pinnedBottom = resolvePinnedData(api, state?.pinnedBottom, identify) || []
    api.updateGridOptions({
      pinnedTopRowData: pinnedTop,
      pinnedBottomRowData: pinnedBottom,
    })
  }

  public async savePinnedState(api: GridApi, key: string, identify: (item: any) => string | number) {
    if (!key || !api || !identify) {
      return
    }

    const state = await this.storage.read(key).catch(() => null as TableStateRecord)
    const pinnedTop = gridGetPinnedTopData(api)?.map(identify)
    const pinnedBottom = gridGetPinnedBottomData(api)?.map(identify)
    this.storage.createOrUpdate({
      columns: null,
      ...(state || {}),
      id: key,
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
