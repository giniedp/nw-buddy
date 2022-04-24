import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { ScopedStorage, StorageBase } from './storage'

export interface ItemMeta {
  price?: number
  stock?: number
  gs?: number
  fav?: boolean
}

@Injectable({ providedIn: 'root' })
export class ItemPreferencesService {
  private storage: StorageBase

  public constructor(preferences: PreferencesService) {
    this.storage = new ScopedStorage(preferences.storage, 'items:')
  }

  public get(itemId: string): ItemMeta {
    return this.storage.read(itemId)
  }

  public getFavouritesIds() {
    return this.storage.keys().filter((id) => this.get(id)?.fav)
  }

  public toggleFavourite(itemId: string) {
    this.merge(itemId, {
      fav: !this.get(itemId)?.fav,
    })
  }

  public merge(itemId: string, meta: ItemMeta) {
    this.update(itemId, {
      ...(this.get(itemId) || {}),
      ...(meta || {}),
    })
  }

  public update(itemId: string, meta: ItemMeta) {
    this.storage.write(itemId, meta)
  }

  public observe(itemId: string) {
    return this.storage.observe(itemId).pipe(
      map((it) => ({
        id: it.key,
        meta: it.value,
      }))
    )
  }
}
