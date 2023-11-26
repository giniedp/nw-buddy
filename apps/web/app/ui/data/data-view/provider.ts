import { ClassProvider, FactoryProvider, StaticProvider, Type } from '@angular/core'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter } from '../table-grid'
import { DATA_VIEW_ADAPTER_OPTIONS, DataViewAdapter, DataViewAdapterOptions } from './data-view-adapter'
import { DataViewService } from './data-view.service'

export interface DataViewProvideOptions<T> extends DataViewAdapterOptions<T> {
  adapter: Type<DataViewAdapter<T>>
}

export interface DataViewProvideOptionsWithFactory<T> {
  adapter: Type<DataViewAdapter<T>>
  factory: () => DataViewAdapterOptions<T>
}

export function provideDataView<T>(
  options: DataViewProvideOptions<T> | DataViewProvideOptionsWithFactory<T>,
): Array<StaticProvider | ClassProvider | FactoryProvider> {
  const result: Array<StaticProvider | ClassProvider | FactoryProvider> = [
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
    // deprecated for table source
    {
      provide: TableGridAdapter,
      useExisting: options.adapter,
    },

    {
      provide: DATA_VIEW_ADAPTER_OPTIONS,
      useValue: options,
    },
    {
      provide: TABLE_GRID_ADAPTER_OPTIONS,
      useValue: options,
    },
  ]

  if ('factory' in options) {
    result.push(
      {
        provide: DATA_VIEW_ADAPTER_OPTIONS,
        useFactory: options.factory,
      },
      {
        provide: TABLE_GRID_ADAPTER_OPTIONS,
        useFactory: options.factory,
      },
    )
  } else {
    result.push(
      {
        provide: DATA_VIEW_ADAPTER_OPTIONS,
        useValue: options,
      },
      {
        provide: TABLE_GRID_ADAPTER_OPTIONS,
        useValue: options,
      },
    )
  }

  return result
}

export function provideDataViewWithFactory<T>(
  options: DataViewProvideOptions<T>,
): Array<StaticProvider | ClassProvider> {
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
