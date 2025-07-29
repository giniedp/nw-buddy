import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { StorageNode } from './storage'

export interface TerritoryPreferences {
  notes?: string
  tags?: string[]
}

@Injectable({ providedIn: 'root' })
export class TerritoriesPreferencesService {
  private storage: StorageNode

  public constructor(preferences: PreferencesService) {
    this.storage = preferences.storage.storageObject('territories')
  }

  public get(id: number): TerritoryPreferences {
    return this.storage.get(String(id))
  }

  public merge(id: number, meta: TerritoryPreferences) {
    this.update(id, {
      ...(this.get(id) || {}),
      ...(meta || {}),
    })
  }

  public update(id: number, meta: TerritoryPreferences) {
    this.storage.set(String(id), meta)
  }

  public observe(id: number) {
    return this.storage.observe<TerritoryPreferences>(String(id)).pipe(map((it) => it.value))
  }
}
