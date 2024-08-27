import { GridOptions } from '@ag-grid-community/core'
import { InjectionToken, inject } from '@angular/core'
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
   * Optional filter to apply to the source
   */
  filter?: (item: T) => boolean
  /**
   * Optional sort order comparator
   */
  sort?: (a: T, b: T) => number
  /**
   * Builder ag-grid configuration
   */
  gridOptions?: (util: TableGridUtils) => GridOptions<T>
  /**
   * Builder virtual grid configuration
   */
  virtualOptions?: (util: TableGridUtils) => VirtualGridOptions<T>
  /**
   * Optional function to retrieve the entity ID
   */
  entityIdD?: (item: T) => string | number
  /**
   * Optional function to retrieve the entity categories
   */
  entityCategoriesD?: (item: T) => DataViewCategory[]
}

export abstract class DataViewAdapter<T> {
  public abstract entityID(item: T): string | number
  public abstract entityCategories(item: T): DataViewCategory[]
  public getCategories?: () => DataViewCategory[]
  public abstract connect(): Observable<T[]>
  public abstract gridOptions(): GridOptions<T>
  public abstract virtualOptions(): VirtualGridOptions<T>
}

export class DataViewDefaultAdapter<T> implements DataViewAdapter<T> {
  private config = inject(DATA_VIEW_ADAPTER_OPTIONS)
  private utils = inject(TableGridUtils)

  public entityID(item: T): string | number {
    return this.config.entityIdD(item)
  }
  public entityCategories(item: T): DataViewCategory[] {
    return this.config.entityCategoriesD(item)
  }
  public getCategories?: () => DataViewCategory[]
  public connect(): Observable<T[]> {
    return this.config.source
  }
  public gridOptions(): GridOptions<T> {
    return this.config.gridOptions?.(this.utils)
  }
  public virtualOptions(): VirtualGridOptions<T> {
    return this.config.virtualOptions?.(this.utils)
  }
}
