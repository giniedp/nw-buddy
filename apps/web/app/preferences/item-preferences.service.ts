import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { StorageScopeNode, StorageNode } from './storage'

export interface ItemMeta {
  price?: number
  stock?: number
  gs?: number
  fav?: boolean
  mark?: number
}

@Injectable({ providedIn: 'root' })
export class ItemPreferencesService {
  private storage: StorageNode

  public constructor(preferences: PreferencesService) {
    this.storage = new StorageScopeNode(preferences.storage, 'items:')
  }

  public get(itemId: string): ItemMeta {
    return this.storage.get(itemId)
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
    this.storage.set(itemId, meta)
  }

  public observe(itemId: string) {
    return this.storage.observe<ItemMeta>(itemId).pipe(
      map((it) => ({
        id: it.key,
        meta: it.value,
      }))
    )
  }

  public clearPrices() {
    this.storage.keys().forEach((key) => {
      this.merge(key, { price: 0 })
    })
  }
}
