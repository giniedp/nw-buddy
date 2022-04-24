import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { ScopedStorage, StorageBase } from './storage'

export interface RecipeInfo {
  fav?: boolean
  learned?: boolean
}

@Injectable({ providedIn: 'root' })
export class RecipePreferencesService {
  private storage: StorageBase

  public constructor(preferences: PreferencesService) {
    this.storage = new ScopedStorage(preferences.storage, 'recipes:')
  }

  public get(itemId: string): RecipeInfo {
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

  public merge(itemId: string, meta: RecipeInfo) {
    this.update(itemId, {
      ...(this.get(itemId) || {}),
      ...(meta || {}),
    })
  }

  public update(itemId: string, meta: RecipeInfo) {
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
