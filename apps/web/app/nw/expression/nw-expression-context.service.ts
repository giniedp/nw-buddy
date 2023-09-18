import { Injectable, Optional, SkipSelf } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'

export interface NwExpressionContext {
  itemId?: string
  charLevel: number
  gearScore: number
  ConsumablePotency?: number
  perkMultiplier?: number
  attribute1?: string
  attribute2?: string
  attribute3?: string
  attribute4?: string
  attribute5?: string
  gearScoreBonus?: boolean
}

@Injectable({
  providedIn: 'root',
})
export class NwExpressionContextService extends ComponentStore<NwExpressionContext> {
  public charLevel$ = this.selectSignal(({ charLevel }) => charLevel)
  public gearScore$ = this.selectSignal(({ gearScore }) => gearScore)
  public gearScoreBonus$ = this.selectSignal(({ gearScoreBonus }) => gearScoreBonus)

  public constructor(
    @Optional()
    @SkipSelf()
    parent: NwExpressionContextService
  ) {
    super({
      charLevel: NW_MAX_CHARACTER_LEVEL,
      gearScore: NW_MAX_GEAR_SCORE,
      ...parent?.get((it) => JSON.parse(JSON.stringify(it)) || {}),
    })
  }
}
