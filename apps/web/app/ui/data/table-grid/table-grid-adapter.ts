import { GridOptions } from '@ag-grid-community/core'
import { ClassProvider, InjectionToken, StaticProvider, Type } from '@angular/core'
import { Observable } from 'rxjs'
import { TableGridUtils } from './table-grid-utils.service'
import { DataTableCategory } from './types'

export const TABLE_GRID_ADAPTER_OPTIONS = new InjectionToken<TableGridAdapterOptions<any>>('TABLE_GRID_ADAPTER_OPTIONS')

export interface TableGridAdapterOptions<T> {
  /**
   * Optional source basewhere entities should be pulled from
   *
   * @remarks
   * If not given an adapter should use its own source
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
   * Optional base grid configuration.
   */
  gridOptions?: (util: TableGridUtils) => GridOptions<T>
}

export interface TableGridAdapterProvideOptions<T> extends TableGridAdapterOptions<T> {
  /**
   * The source component type
   */
  type: Type<TableGridAdapter<T>>
}

export function provideTableGrid<T>(options: TableGridAdapterProvideOptions<T>): Array<StaticProvider | ClassProvider> {
  const result: Array<StaticProvider | ClassProvider> = [
    {
      provide: options.type,
    },
    {
      provide: TableGridAdapter,
      useExisting: options.type,
    },
    {
      provide: TABLE_GRID_ADAPTER_OPTIONS,
      useValue: options,
    },
  ]
  return result
}

export abstract class TableGridAdapter<T> {
  public static provide = provideTableGrid
  public abstract entityID(item: T): string | number
  public abstract entityCategories(item: T): DataTableCategory[]
  public getCategories?: () => DataTableCategory[]
  public abstract gridOptions(): GridOptions
  public abstract connect(): Observable<T[]>

  public onEntityCreate?: Observable<T>
  public onEntityUpdate?: Observable<T>
  public onEntityDestroy?: Observable<string>
}
