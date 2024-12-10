import { Injectable, inject } from '@angular/core'
import { NW_MAX_TRADESKILL_LEVEL } from '@nw-data/common'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { injectNwData } from '../nw-data'
import { CharacterStore } from './character.store'

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private db = injectNwData()
  private char = inject(CharacterStore)

  public tradeskillLevel(skill$: Observable<string>) {
    return skill$.pipe(
      switchMap((skill) => this.char.observeProgressionLevel(skill)),
      map((level) => level ?? NW_MAX_TRADESKILL_LEVEL),
    )
  }

  public tradeskillLevelData(skill$: Observable<string>) {
    return combineLatest({
      skill: skill$,
      level: this.tradeskillLevel(skill$),
    }).pipe(
      switchMap(({ skill, level }) => {
        return this.db.tradeskillRankDataByTradeskillAndLevel(skill, level)
      }),
    )
  }
}
