import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { MAIN_MENU } from './menu'
import { PlatformService } from './utils/platform.service'

export const landingRedirect: CanActivateFn = () => {
  if (inject(PlatformService).isOverwolf) {
    return inject(Router).createUrlTree([MAIN_MENU[0].items[0].path])
  }
  return true
}
