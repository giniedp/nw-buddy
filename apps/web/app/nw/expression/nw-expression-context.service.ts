import { Injectable, Optional, SkipSelf } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE, getPerkMultiplier } from '@nw-data/common'
import { PerkData } from '@nw-data/generated'
import { Observable, map } from 'rxjs'
import { ExpressionVariable } from './types'

export type NwExpressionContext = {
  charLevel: number
  gearScore: number
  gearScoreBonus?: boolean
  itemId?: string
} & Partial<Record<ExpressionVariable, string | number | boolean | Observable<string | number | boolean>>>

@Injectable({
  providedIn: 'root',
})
export class NwTextContextService extends ComponentStore<NwExpressionContext> {
  public charLevel$ = this.selectSignal(({ charLevel }) => charLevel)
  public gearScore$ = this.selectSignal(({ gearScore }) => gearScore)
  public gearScoreBonus$ = this.selectSignal(({ gearScoreBonus }) => gearScoreBonus)

  public constructor(
    @Optional()
    @SkipSelf()
    parent: NwTextContextService,
  ) {
    super({
      charLevel: NW_MAX_CHARACTER_LEVEL,
      gearScore: NW_MAX_GEAR_SCORE,
      attribute1: '…',
      attribute2: '…',
      ...parent?.get((it) => JSON.parse(JSON.stringify(it)) || {}),
    })
  }

  public forPerk(perk: PerkData): NwExpressionContext {
    return this.get((state) => {
      return {
        ...state,
        itemId: perk?.PerkID,
        perkMultiplier: perk ? getPerkMultiplier(perk, state.gearScore) : 1,
        attribute1: '…',
        attribute2: '…',
      }
    })
  }

  public derive(options: Partial<NwExpressionContext>): Observable<NwExpressionContext> {
    return this.state$.pipe(
      map((state) => {
        return {
          ...state,
          ...options,
        }
      }),
    )
  }
}
