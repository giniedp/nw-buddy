import { GridOptions } from '@ag-grid-community/core'
import { ClassProvider, InjectionToken, StaticProvider, Type } from '@angular/core'
import { Observable } from 'rxjs'
import { DataTableUtils } from './data-grid-utils.service'
import { DataTableCategory } from './types'

export const DATA_TABLE_SOURCE_OPTIONS = new InjectionToken<DataTableSourceOptions<any>>('DATA_TABLE_SOURCE_OPTIONS')

export interface DataTableSourceOptions<T> {
  /**
   * Optional source basewhere entities should be pulled from
   *
   * @remarks
   * If not given an adapter should use its own source
   */
  source?: Observable<T[]>
  /**
   * Optional base grid configuration.
   */
  gridOptions?: (util: DataTableUtils) => GridOptions<T>
}

export interface DataTableSourceProvideOptions<T> extends DataTableSourceOptions<T> {
  /**
   * The source component type
   */
  type: Type<DataGridAdapter<T>>
}

export function provideTableSource<T>(
  options: DataTableSourceProvideOptions<T>
): Array<StaticProvider | ClassProvider> {
  const result: Array<StaticProvider | ClassProvider> = [
    {
      provide: options.type,
    },
    {
      provide: DataGridAdapter,
      useExisting: options.type,
    },
    {
      provide: DATA_TABLE_SOURCE_OPTIONS,
      useValue: options,
    },
  ]
  return result
}

export abstract class DataGridAdapter<T> {
  public static provide = provideTableSource
  public abstract entityID(item: T): string | number
  public abstract entityCategories(item: T): DataTableCategory[]
  public abstract gridOptions(): GridOptions
  public abstract connect(): Observable<T[]>
}
