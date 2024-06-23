import { enableProdMode } from '@angular/core'

import { bootstrapApplication } from '@angular/platform-browser'
import { AppFrameComponent } from '~/app-frame.component'
import { appConfig } from './app/app.config'
import { environment } from './environments/environment'

if (environment.production) {
  enableProdMode()
}

bootstrapApplication(AppFrameComponent, appConfig).catch((err) => console.error(err))
