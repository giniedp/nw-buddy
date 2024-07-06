import { Platform } from '@angular/cdk/platform'
import { inject } from '@angular/core'

export function injectIsBrowser() {
  return inject(Platform).isBrowser
}
