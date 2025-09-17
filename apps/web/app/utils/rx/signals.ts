import { linkedSignal, resource, ResourceRef, Signal, WritableSignal } from '@angular/core'

export interface ResourceValueOptions {
  /**
   * Keeps the previous value alive while next value is loading
   */
  keepPrevious?: boolean
}
export function resourceValue<T, R>(options: Parameters<typeof resource<T, R>>[0] & ResourceValueOptions): WritableSignal<T> {
  return resourceValueOf(resource(options), { keepPrevious: options?.keepPrevious })
}

export function resourceValueOf<T>(resource: ResourceRef<T>, options?: ResourceValueOptions): WritableSignal<T> {
  return linkedSignal({
    source: () => ({
      value: resource.hasValue() ? resource.value() : null,
      isLoading: resource.isLoading(),
    }),
    computation: (source, previous) => {
      if (previous && source.isLoading && options?.keepPrevious) {
        return previous.value
      }
      return source.value
    },
  })
}
