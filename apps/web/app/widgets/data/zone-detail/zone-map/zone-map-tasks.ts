import { isPlatformServer } from '@angular/common'
import { InjectionToken, PLATFORM_ID, inject } from '@angular/core'
import { wrap } from 'comlink'
import type { ZoneMapTasks } from './zone-map.worker'
export type { ZoneMapTasks } from './zone-map.worker'

export const ZONE_MAP_TASKS = new InjectionToken<ZoneMapTasks>('ZONE_MAP_TASKS', {
  providedIn: 'root',
  factory: () => {
    if (isPlatformServer(inject(PLATFORM_ID))) {
      return null
    }
    const worker = new Worker(new URL('./zone-map.worker', import.meta.url))
    return wrap<ZoneMapTasks>(worker)
  },
})
