import { ClassProvider, FactoryProvider, InjectOptions, StaticProvider, Type, inject } from '@angular/core'
import {
  DATA_VIEW_ADAPTER_OPTIONS,
  DataViewAdapter,
  DataViewAdapterOptions,
  DataViewDefaultAdapter,
} from './data-view-adapter'
import { DataViewService } from './data-view.service'

export type DataViewProvideOptions<T> =
  | {
      adapter: Type<DataViewAdapter<T>>
    }
  | {
      adapter: Type<DataViewAdapter<T>>
      factory: () => DataViewAdapterOptions<T>
    }
  | (DataViewAdapterOptions<T> & { adapter?: Type<DataViewAdapter<T>> })

export function injectDataViewAdapterOptions<T>(injectOptions?: InjectOptions) {
  return inject<DataViewAdapterOptions<T>>(DATA_VIEW_ADAPTER_OPTIONS, injectOptions)
}

export function provideDataView<T>(
  options: DataViewProvideOptions<T>,
): Array<StaticProvider | ClassProvider | FactoryProvider> {
  const adapter = options.adapter || DataViewDefaultAdapter
  const result: Array<StaticProvider | ClassProvider | FactoryProvider> = [
    {
      provide: adapter,
    },
    {
      provide: DataViewAdapter,
      useExisting: adapter,
    },
    {
      provide: DataViewService,
      useClass: DataViewService,
    },
  ]

  if ('factory' in options) {
    result.push({
      provide: DATA_VIEW_ADAPTER_OPTIONS,
      useFactory: options.factory,
    })
  } else {
    result.push({
      provide: DATA_VIEW_ADAPTER_OPTIONS,
      useValue: options,
    })
  }

  return result
}
