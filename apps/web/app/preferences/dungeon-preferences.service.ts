import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PreferencesService } from './preferences.service'
import { StorageNode } from './storage'

export interface DungeonPreference {
  ranks?: Record<string, DifficultyRank>
}

export type DifficultyRank = 'gold' | 'silver' | 'bronze'

@Injectable({ providedIn: 'root' })
export class DungeonPreferencesService {
  private storage: StorageNode<DungeonPreference>

  public constructor(preferences: PreferencesService) {
    this.storage = preferences.storage.storageScope('dungeons:')
  }

  public get(id: string) {
    return this.storage.get(id)
  }

  public observe(id: string) {
    return this.storage.observe(id).pipe(map((it) => it.value))
  }

  public observeRank(id: string, difficulty: string | number) {
    return this.observe(id).pipe(map((it) => it?.ranks?.[difficulty]))
  }

  public updateRank(id: string, difficulty: string | number, rank: DifficultyRank) {
    const data = {
      ...(this.storage.get(id) || {}),
    }
    data.ranks = {
      ...(data.ranks || {}),
      [difficulty]: rank,
    }
    this.storage.set(id, data)
  }
}
