import { enableProdMode } from '@angular/core'

import { environment } from './environments/environment'
import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { appServerConfig } from './app/app.config.server'

if (environment.production) {
  enableProdMode()
}

const bootstrap = () => bootstrapApplication(AppComponent, appServerConfig)

export default bootstrap
