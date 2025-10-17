import { effect, linkedSignal, resource, ResourceRef, Signal, WritableSignal } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'

export interface ResourceValueOptions {
  /**
   * Keeps the previous value alive while next value is loading
   */
  keepPrevious?: boolean
}
export function resourceValue<T, R>(options: Parameters<typeof resource<T, R>>[0] & ResourceValueOptions): WritableSignal<T> {
  return resourceValueOf(resource(options), { keepPrevious: options?.keepPrevious })
}

export function rxResourceValue<T, R>(options: Parameters<typeof rxResource<T, R>>[0] & ResourceValueOptions): WritableSignal<T> {
  return resourceValueOf(rxResource(options), { keepPrevious: options?.keepPrevious })
}

export function resourceValueOf<T>(resource: ResourceRef<T>, options?: ResourceValueOptions): WritableSignal<T> {
  effect(() => {
    const error = resource.error()
    if (error) {
      console.error(error)
    }
  })
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
