import { enableProdMode } from '@angular/core'

import { bootstrapApplication } from '@angular/platform-browser'
import { AppFrameComponent } from '~/app-frame.component'
import { appConfig } from './app/app.config'
import { environment } from './environments/environment'
import posthog from 'posthog-js'

if (environment.production) {
  enableProdMode()
}

if (environment.posthogKey && environment.posthogHost) {
  try {
    posthog.init(environment.posthogKey, {
      api_host: environment.posthogHost,
      person_profiles: 'never',
      defaults: '2025-05-24',
      cookieless_mode: 'always',
    })
  } catch (e) {
    console.error(e)
  }
}

bootstrapApplication(AppFrameComponent, appConfig).catch((err) => console.error(err))
