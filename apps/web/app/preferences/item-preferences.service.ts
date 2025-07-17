import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { StorageScopeNode, StorageNode } from './storage'

export interface ItemMeta {
  price?: number
  stock?: number
}

@Injectable({ providedIn: 'root' })
export class ItemPreferencesService {
  private storage: StorageNode

  public constructor(preferences: PreferencesService) {
    this.storage = new StorageScopeNode(preferences.storage, 'items:')
    this.migrate()
  }

  public get(itemId: string): ItemMeta {
    return this.storage.get(itemId?.toLowerCase())
  }

  public merge(itemId: string, meta: ItemMeta) {
    this.update(itemId, {
      ...(this.get(itemId) || {}),
      ...(meta || {}),
    })
  }

  public update(itemId: string, meta: ItemMeta) {
    this.storage.set(itemId?.toLowerCase(), meta)
  }

  public observe(itemId: string) {
    return this.storage.observe<ItemMeta>(itemId?.toLowerCase()).pipe(
      map((it) => ({
        id: it.key,
        meta: it.value,
      })),
    )
  }

  public clearPrices() {
    this.storage.keys().forEach((key) => {
      this.merge(key, { price: 0 })
    })
  }

  private migrate() {
    const keys = this.storage.keys().filter((it) => it !== it.toLowerCase())
    for (const key of keys) {
      const value = this.storage.get(key)
      this.storage.delete(key)
      this.storage.set(key.toLowerCase(), value)
    }
  }
}
