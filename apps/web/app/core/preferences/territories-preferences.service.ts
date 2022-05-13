import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { StorageNode } from './storage'

export interface TerritoryMeta {
  standing?: number
}

@Injectable({ providedIn: 'root' })
export class TerritoriesPreferencesService {
  private storage: StorageNode

  public constructor(preferences: PreferencesService) {
    this.storage = preferences.storage.storageObject('territories')
  }

  public get(id: number): TerritoryMeta {
    return this.storage.get(String(id))
  }

  public merge(id: number, meta: TerritoryMeta) {
    this.update(id, {
      ...(this.get(id) || {}),
      ...(meta || {}),
    })
  }

  public update(id: number, meta: TerritoryMeta) {
    this.storage.set(String(id), meta)
  }

  public observe(id: number) {
    return this.storage.observe<TerritoryMeta>(String(id)).pipe(
      map((it) => it.value)
    )
  }
}
