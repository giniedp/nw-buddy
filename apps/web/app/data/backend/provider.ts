import { inject, InjectionToken, Type } from '@angular/core'
import { environment } from '../../../environments'
import type { BackendAdapter } from './backend-adapter'
import { NoBackendAdapter } from './no-backend'
import { PocketbaseAdapter } from './pocketbase/pocketbase-adapter'

export const BACKEND_ADAPTER = new InjectionToken<BackendAdapter>('BACKEND_ADAPTER', {
  providedIn: 'root',
  factory: () => {
    if (environment.pocketbaseUrl) {
      return inject(PocketbaseAdapter)
    }
    return inject(NoBackendAdapter)
  },
})

export function provideBackendAdapter(adapterClass: Type<BackendAdapter>) {
  return { provide: BACKEND_ADAPTER, useClass: adapterClass }
}

export function injectBackendAdapter() {
  return inject(BACKEND_ADAPTER)
}
