import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http'
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core'
import { provideBackendAdapter } from '~/data/backend/provider'
import { TestBackendAdapter } from '~/data/backend/test'

export const testAppConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    provideZonelessChangeDetection(),
    provideBackendAdapter(TestBackendAdapter),
  ],
}
