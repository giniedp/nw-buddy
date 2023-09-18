import { Injectable, Optional, SkipSelf } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'
import { BehaviorSubject, combineLatest, defer } from 'rxjs'

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
}

@Injectable({
  providedIn: 'root',
})
export class NwExpressionContextService extends ComponentStore<NwExpressionContext> {
  public get level() {
    return this.level$.value
  }
  public set level(value: number) {
    this.level$.next(value)
  }

  public get gs() {
    return this.gearScore$.value
  }
  public set gs(value: number) {
    this.gearScore$.next(value)
  }

  public get gsBonus() {
    return this.gearScoreBonus$.value
  }
  public set gsBonus(value: boolean) {
    this.gearScoreBonus$.next(value)
  }

  public value = defer(() =>
    combineLatest({
      level: this.level$,
      gs: this.gearScore$,
      gsBonus: this.gearScoreBonus$,
    })
  )

  private level$ = new BehaviorSubject(NW_MAX_CHARACTER_LEVEL)
  private gearScore$ = new BehaviorSubject(650)
  private gearScoreBonus$ = new BehaviorSubject(false)
  public constructor(
    @Optional()
    @SkipSelf()
    parent: NwExpressionContextService
  ) {
    super({
      charLevel: parent?.get(({ charLevel }) => charLevel) ?? NW_MAX_CHARACTER_LEVEL,
      gearScore: parent?.get(({ gearScore }) => gearScore) ?? NW_MAX_GEAR_SCORE,
      itemId: parent?.get(({ itemId }) => itemId) ?? null,
      perkMultiplier: parent?.get(({ perkMultiplier }) => perkMultiplier) ?? null,
      ConsumablePotency: parent?.get(({ ConsumablePotency }) => ConsumablePotency) ?? null,
    })
  }
}
