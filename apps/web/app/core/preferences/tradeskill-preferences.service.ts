import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { ScopedStorage, StorageBase } from './storage'

export interface TradeskillMeta {
  level?: number
}

@Injectable({ providedIn: 'root' })
export class TradeskillPreferencesService {
  private storage: StorageBase

  public constructor(preferences: PreferencesService) {
    this.storage = new ScopedStorage(preferences.storage, 'tradeskill:')
  }

  public get(itemId: string): TradeskillMeta {
    return this.storage.read(itemId)
  }

  public merge(itemId: string, meta: TradeskillMeta) {
    this.update(itemId, {
      ...(this.get(itemId) || {}),
      ...(meta || {}),
    })
  }

  public update(itemId: string, meta: TradeskillMeta) {
    this.storage.write(itemId, meta)
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
