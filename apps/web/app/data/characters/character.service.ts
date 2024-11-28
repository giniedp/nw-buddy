import { Injectable, Injector, computed, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { DomSanitizer } from '@angular/platform-browser'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_TRADESKILL_LEVEL } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { DATASHEETS } from '@nw-data/generated'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { eqCaseInsensitive } from '~/utils'
import { ImagesDB } from '../images'
import { injectNwData } from '../nw-data'
import { CharactersDB } from './characters.db'

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private db = injectNwData()
  private charDb = inject(CharactersDB)
  private images = inject(ImagesDB)
  private sanitizer = inject(DomSanitizer)
  private injector = inject(Injector)

  private data = toSignal(this.charDb.observeCurrent())
  public readonly name = computed(() => this.data()?.name)
  public readonly serverName = computed(() => this.data()?.serverName)
  public readonly companyName = computed(() => this.data()?.companyName)
  public readonly faction = computed(() => this.data()?.faction)
  public readonly level = computed(() => this.data()?.level ?? NW_MAX_CHARACTER_LEVEL)
  public readonly tradeskillLevels = computed(() => this.data()?.tradeskillLevels || {})
  public readonly tradeskillLevels$ = toObservable(this.tradeskillLevels)
  public readonly tradeskillSets = computed(() => this.data()?.tradeskillSets || {})
  public readonly tradeskillBonus = computed(() => this.data()?.tradeskillBonus || {})
  public readonly craftingFlBonus = computed(() => this.data()?.craftingFlBonus)
  public readonly weaponLevels = computed(() => this.data()?.weaponLevels || {})
  public readonly imageId = computed(() => this.data()?.imageId)
  public readonly image = toSignal(this.images.observeByid(toObservable(this.imageId)))

  public tradeskillLevel(skill$: Observable<string>) {
    return combineLatest({
      skill: skill$,
      levels: this.tradeskillLevels$,
    }).pipe(
      map(({ skill, levels }) => {
        for (const [key, value] of Object.entries(levels)) {
          if (eqCaseInsensitive(key, skill)) {
            return value ?? NW_MAX_TRADESKILL_LEVEL
          }
        }
        return 0
      }),
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
