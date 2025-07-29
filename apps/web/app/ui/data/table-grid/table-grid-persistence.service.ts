import { ColumnState, GridApi } from '@ag-grid-community/core'
import { EventEmitter, Injectable, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TableStateRecord, TableStatesService } from '~/data'
import { PreferencesService, StorageNode } from '~/preferences'
import { compressQueryParam, decompressQueryParam } from '~/utils'
import { gridGetPinnedBottomData, gridGetPinnedTopData } from '../ag-grid/utils'

const QUERY_PARAM_GRID_STATE = 'gridState'

@Injectable()
export class TableGridPersistenceService {
  private service = inject(TableStatesService)
  private route = inject(ActivatedRoute)
  private router = inject(Router)

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
    const current = await this.service.read(key).catch(() => null as TableStateRecord)
    await this.service
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

  public async restoreState(api: GridApi, key: string, ignoreQueryParams = false) {
    const qState = ignoreQueryParams ? null : this.fromQueryParams()

    await this.loadColumnState(api, key, qState?.columns).catch(console.error)
    await this.loadFilterState(api, key, qState?.filter).catch(console.error)
    await this.clearQueryParams()
  }

  public async loadColumnState(api: GridApi, key: string, state?: ColumnState[]) {
    if (!key || !api) {
      return
    }

    const current = await this.service.read(key).catch(() => null as TableStateRecord)
    const data = state ?? current?.columns
    if (data) {
      api.applyColumnState({ state: data, applyOrder: true })
    }
  }

  public async loadFilterState(api: GridApi, key: string, state?: any) {
    const data = state ?? this.filterStorage.get(key)?.filter
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
    const state = await this.service.read(key).catch(() => null as TableStateRecord)
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

    const state = await this.service.read(key).catch(() => null as TableStateRecord)
    const pinnedTop = gridGetPinnedTopData(api)?.map(identify)
    const pinnedBottom = gridGetPinnedBottomData(api)?.map(identify)
    this.service.createOrUpdate({
      columns: null,
      ...(state || {}),
      id: key,
      pinnedTop: pinnedTop,
      pinnedBottom: pinnedBottom,
    })
  }

  private getQueryParam() {
    return this.route.snapshot.queryParamMap.get(QUERY_PARAM_GRID_STATE)
  }
  private fromQueryParams() {
    const param = this.getQueryParam()
    const state = decompressQueryParam<{ columns: any; filter: any }>(param)
    return {
      columns: state?.columns as ColumnState[],
      filter: state?.filter,
    }
  }

  private async clearQueryParams() {
    const param = this.getQueryParam()
    if (!param) {
      return true
    }
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [QUERY_PARAM_GRID_STATE]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
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

export function gridStateToQueryParams(api: GridApi) {
  return {
    [QUERY_PARAM_GRID_STATE]: compressQueryParam({
      columns: api.getColumnState(),
      filter: api.getFilterModel(),
    }),
  }
}
