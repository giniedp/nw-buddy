import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { APP_MENU } from './app-menu'
import { PlatformService } from './utils/services/platform.service'

export const landingRedirect: CanActivateFn = () => {
  if (inject(PlatformService).isOverwolf) {
    return inject(Router).createUrlTree([APP_MENU[0].items[0].path])
  }
  return true
}
