import { Injectable, inject } from '@angular/core'
import { Observable, combineLatest, switchMap } from 'rxjs'
import { injectNwData } from '../nw-data'
import { CharacterStore } from './character.store'

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private db = injectNwData()
  private char = inject(CharacterStore)

  public tradeskillLevel(skill$: Observable<string>) {
    return skill$.pipe(switchMap((skill) => this.char.observeTradeskillLevel(skill)))
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
