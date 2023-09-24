import { ClassProvider, StaticProvider, Type } from '@angular/core'
import { DATA_VIEW_ADAPTER_OPTIONS, DataViewAdapter, DataViewAdapterOptions } from './data-view-adapter'
import { DataViewService } from './data-view.service'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter } from '../table-grid'

export interface DataViewProvideOptions<T> extends DataViewAdapterOptions<T> {
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
      provide: DataViewService,
      useClass: DataViewService,
    },
    {
      provide: DATA_VIEW_ADAPTER_OPTIONS,
      useValue: options,
    },
    // deprecated for table source
    {
      provide: TableGridAdapter,
      useExisting: options.adapter,
    },
    {
      provide: TABLE_GRID_ADAPTER_OPTIONS,
      useValue: options,
    },
  ]
  return result
}
