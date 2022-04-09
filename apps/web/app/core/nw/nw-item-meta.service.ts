import { Injectable } from '@angular/core'

export interface ItemMeta {
  price?: number
  inStock?: number
}

@Injectable({ providedIn: 'root' })
export class NwItemMetaService {
  private cache = new Map<string, ItemMeta>()

  public constructor() {}

  public get(itemId: string): ItemMeta {
    if (!this.cache.has(itemId)) {
      this.cache.set(itemId, JSON.parse(localStorage.getItem(itemId)))
    }
    return this.cache.get(itemId)
  }

  public merge(itemId: string, meta: ItemMeta) {
    const item = {
      ...(this.get(itemId) || {}),
      ...(meta || {}),
    }
  }

  public update(itemId: string, meta: ItemMeta) {
    this.cache.set(itemId, meta)
    if (meta) {
      localStorage.setItem(itemId, JSON.stringify(meta))
    } else {
      localStorage.removeItem(itemId)
    }
  }
}
