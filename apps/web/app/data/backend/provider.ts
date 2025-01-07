import { inject, InjectionToken, Type } from '@angular/core'
import type { BackendAdapter } from './backend-adapter'
import { NoBackendAdapter } from './no-backend'

export const BACKEND_ADAPTER = new InjectionToken<BackendAdapter>('BACKEND_ADAPTER', {
  providedIn: 'root',
  factory: () => {
    return inject(NoBackendAdapter)
  },
})

export function provideBackendAdapter(adapterClass: Type<BackendAdapter>) {
  return { provide: BACKEND_ADAPTER, useClass: adapterClass }
}

export function injectBackendAdapter() {
  return inject(BACKEND_ADAPTER)
}
