import { GridOptions } from '@ag-grid-community/core'
import { Observable } from 'rxjs'
import { DataGridCategory } from './types'
import { ClassProvider, Injectable, StaticProvider, Type } from '@angular/core'
import { DataGridUtils } from './data-grid-utils.service'
import { DataGridStore } from './data-grid.store'

@Injectable()
export class DataGridSourceOptions<T> {
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
  buildOptions?: (util: DataGridUtils) => GridOptions<T>
}

export function provideGrid<T>(options: {
  source: Type<DataGridSource<T>>
  options?: DataGridSourceOptions<T>
}): Array<StaticProvider | ClassProvider> {
  const result: Array<StaticProvider | ClassProvider> = [
    {
      provide: options.source,
    },
    {
      provide: DataGridSource,
      useExisting: options.source,
    },
  ]
  if (options.options) {
    result.push({
      provide: DataGridSourceOptions,
      useValue: options.options,
    })
  }
  return result
}

export abstract class DataGridSource<T> {
  public static provide = provideGrid
  public abstract entityID(item: T): string | number
  public abstract entityCategories(item: T): DataGridCategory[]
  public abstract buildOptions(): GridOptions
  public abstract connect(): Observable<T[]>
}
