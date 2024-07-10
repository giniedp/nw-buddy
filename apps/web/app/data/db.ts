import { inject, InjectionToken } from '@angular/core'

import { injectIsBrowser } from '~/utils/injection/platform'
import { AppDb } from './app-db'
import { AppDbDexie } from './app-db.dexie'
import { AppDbNoop } from './app-db.noop'

export function injectAppDBName() {
  return inject(APP_DB_NAME)
}

export function injectAppDB() {
  return inject(APP_DB)
}

export const APP_DB_NAME = new InjectionToken<string>('APP_DB_NAME', {
  factory: () => 'nw-buddy',
})

export const APP_DB = new InjectionToken<AppDb>('APP_DB', {
  providedIn: 'root',
  factory: () => {
    if (injectIsBrowser()) {
      return new AppDbDexie(injectAppDBName())
    }
    return new AppDbNoop(injectAppDBName())
  },
})
