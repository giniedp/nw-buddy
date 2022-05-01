import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { StorageNode } from './storage'

export interface TradeskillMeta {
  level?: number
}

@Injectable({ providedIn: 'root' })
export class TradeskillPreferencesService {
  private storage: StorageNode

  public constructor(preferences: PreferencesService) {
    this.storage = preferences.storage.storageObject('tradeskills')
  }

  public get(itemId: string): TradeskillMeta {
    return this.storage.get(itemId)
  }

  public merge(itemId: string, meta: TradeskillMeta) {
    this.update(itemId, {
      ...(this.get(itemId) || {}),
      ...(meta || {}),
    })
  }

  public update(itemId: string, meta: TradeskillMeta) {
    this.storage.set(itemId, meta)
  }

  public observe(itemId: string) {
    return this.storage.observe<TradeskillMeta>(itemId).pipe(
      map((it) => ({
        id: it.key,
        meta: it.value,
      }))
    )
  }
}
