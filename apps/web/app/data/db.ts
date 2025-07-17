import { inject, InjectionToken } from '@angular/core'

import { injectIsBrowser } from '~/utils/injection/platform'
import { AppDb } from './app-db'
import { AppDbDexie } from './app-db.dexie'
import { AppDbNoop } from './app-db.noop'
import { DATABASE_NAME } from './constants'

export function injectAppDB() {
  return inject(APP_DB)
}

export const APP_DB = new InjectionToken<AppDb>('APP_DB', {
  providedIn: 'root',
  factory: () => {
    if (injectIsBrowser()) {
      return new AppDbDexie(DATABASE_NAME)
    }
    return new AppDbNoop(DATABASE_NAME)
  },
})
