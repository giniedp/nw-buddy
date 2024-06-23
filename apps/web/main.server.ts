import { enableProdMode } from '@angular/core'

import { bootstrapApplication } from '@angular/platform-browser'
import { AppFrameComponent } from '~/app-frame.component'
import { appServerConfig } from './app/app.config.server'
import { environment } from './environments/environment'

if (environment.production) {
  enableProdMode()
}

const bootstrap = () => bootstrapApplication(AppFrameComponent, appServerConfig)

export default bootstrap
