import { inject } from '@angular/core'
import { PreferencesService } from '~/preferences'

/**
 * The map selected last on `/map`, restored when `/map` opens without a map id
 */
export function injectLastMap() {
  return inject(PreferencesService).storage.storageProperty<string>('zone-map-last-map', null)
}
