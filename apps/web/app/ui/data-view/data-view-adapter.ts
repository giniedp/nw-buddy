import { GridOptions } from '@ag-grid-community/core'
import { ClassProvider, InjectionToken, StaticProvider, Type } from '@angular/core'
import { Observable } from 'rxjs'
import { DataTableUtils } from '../data-grid'
import { DataViewCategory } from './data-view-category'
import { VirtualGridOptions } from '../virtual-grid/virtual-grid-options'

export const DATA_VIEW_SOURCE_OPTIONS = new InjectionToken<DataViewOptions<any>>('DATA_VIEW_SOURCE_OPTIONS')

export interface DataViewOptions<T> {
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
  gridOptions?: (util: DataTableUtils) => GridOptions<T>
  /**
   * Builder for virtual-grid configuration
   */
  virtualOptions?: (util: DataTableUtils) => VirtualGridOptions<T>
}

export interface DataViewProvideOptions<T> extends DataViewOptions<T> {
  adapter: Type<DataViewAdapter<T>>
}

export function provideDataView<T>(options: DataViewProvideOptions<T>): Array<StaticProvider | ClassProvider> {
  const result: Array<StaticProvider | ClassProvider> = [
    {
      provide: options.adapter,
    },
    {
      provide: DataViewAdapter,
      useExisting: options.adapter,
    },
    {
      provide: DATA_VIEW_SOURCE_OPTIONS,
      useValue: options,
    },
  ]
  return result
}

export abstract class DataViewAdapter<T> {
  public static provide = provideDataView
  public abstract entityID(item: T): string | number
  public abstract entityCategories(item: T): DataViewCategory[]
  public abstract connect(): Observable<T[]>
  public abstract gridOptions(): GridOptions<T>
  public abstract virtualOptions(): VirtualGridOptions<T>
}
