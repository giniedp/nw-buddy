import { Injectable } from '@angular/core'
import { isEqual } from 'lodash'
import { filter, startWith, Subject } from 'rxjs'

export interface ItemMeta {
  price?: number
  stock?: number
  gs?: number
  fav?: boolean
}

const ITEM_PREFIX = 'nwb-item'

@Injectable({ providedIn: 'root' })
export class NwItemMetaService {
  private cache = new Map<string, ItemMeta>()
  private change = new Subject<{ id: string, meta: ItemMeta }>()

  public constructor() {}

  public get(itemId: string): ItemMeta {
    const key = this.key(itemId)
    if (!this.cache.has(key)) {
      this.cache.set(key, JSON.parse(localStorage.getItem(key)))
    }
    return this.cache.get(key)
  }

  public getFavouritesIds() {
    return Object.keys(localStorage)
      .filter((it) => it.startsWith(`${ITEM_PREFIX}:`))
      .map((it) => it.replace(`${ITEM_PREFIX}:`, ''))
      .filter((id) => this.get(id)?.fav)
  }

  public toggleFavourite(itemId: string) {
    this.merge(itemId, {
      fav: !this.get(itemId)?.fav
    })
  }

  public merge(itemId: string, meta: ItemMeta) {
    this.update(itemId, {
      ...(this.get(itemId) || {}),
      ...(meta || {}),
    })
  }

  public update(itemId: string, meta: ItemMeta) {
    const old = this.get(itemId)
    if (isEqual(old, meta)) {
      return
    }
    const key = this.key(itemId)
    if (meta) {
      localStorage.setItem(key, JSON.stringify(meta))
    } else {
      localStorage.removeItem(key)
    }
    this.cache.set(key, meta || null)
    this.change.next({ id: itemId, meta: this.get(itemId)})
  }

  public observe(itemId: string) {
    return this.change
      .pipe(filter((it) => it.id === itemId))
      .pipe(startWith({
        id: itemId,
        meta: this.get(itemId)
      }))
  }

  private key(itemId: string) {
    return `${ITEM_PREFIX}:${itemId}`
  }
}
