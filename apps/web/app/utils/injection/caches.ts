import { inject, InjectionToken } from '@angular/core'
import { injectWindow } from './window'

export const CACHES = new InjectionToken<CacheStorage>('An abstraction over window.caches object', {
  factory: () => injectWindow().caches,
})

export function injectCaches(): CacheStorage {
  return inject(CACHES)
}
