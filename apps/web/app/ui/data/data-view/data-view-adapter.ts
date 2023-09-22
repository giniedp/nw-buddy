import { GridOptions } from '@ag-grid-community/core'
import { InjectionToken } from '@angular/core'
import { Observable } from 'rxjs'
import { TableGridUtils } from '../table-grid'
import { VirtualGridOptions } from '../virtual-grid/virtual-grid-options'
import { DataViewCategory } from './data-view-category'

export const DATA_VIEW_ADAPTER_OPTIONS = new InjectionToken<DataViewAdapterOptions<any>>('DATA_VIEW_ADAPTER_OPTIONS')

/**
 * Options to override the default behavior of the data view adapter
 *
 * @remarks
 * Mainly used to override the data source and the column definitions
 * for picker dialogs, when a narrowed set of columns and data is needed
 */
export interface DataViewAdapterOptions<T> {
  /**
   * Optional source where entities should be pulled from
   *
   * @remarks
   * If not given, a default source should be used by the host adapter
   */
  source?: Observable<T[]>
  /**
   * Builder ag-grid configuration
   */
  gridOptions?: (util: TableGridUtils) => GridOptions<T>
}
export abstract class DataViewAdapter<T> {
  public abstract entityID(item: T): string | number
  public abstract entityCategories(item: T): DataViewCategory[]
  public getCategories?: () => DataViewCategory[]
  public abstract connect(): Observable<T[]>
  public abstract gridOptions(): GridOptions<T>
  public abstract virtualOptions(): VirtualGridOptions<T>

  public onEntityCreate?: Observable<T>
  public onEntityUpdate?: Observable<T>
  public onEntityDestroy?: Observable<string>
}
