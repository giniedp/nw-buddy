import { Injectable } from '@angular/core'
import { defer, map } from 'rxjs'
import { shareReplayRefCount } from '~/utils'

import { PreferencesService } from './preferences.service'
import { StorageProperty } from './storage'

export interface TradeskillMeta {
  level?: number
}

const MIN = 1
const MAX = 60

@Injectable({ providedIn: 'root' })
export class CharacterPreferencesService {

  public readonly level: StorageProperty<number>
  public readonly level$ = defer(() => this.level.observe())
    .pipe(map((value) => {
      value = value || MAX
      return value < MIN ? MIN : value > MAX ? MAX : value
    }))
    .pipe(shareReplayRefCount(1))

  public constructor(preferences: PreferencesService) {
    const storage = preferences.storage.storageObject('character')
    this.level = storage.storageProperty<number>('language', 60)
  }
}
