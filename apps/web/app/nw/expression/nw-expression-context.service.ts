import { Injectable } from '@angular/core'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { BehaviorSubject, combineLatest, defer } from 'rxjs'

export interface NwExpressionContext {
  text: string
  itemId?: string
  charLevel: number
  gearScore: number
  ConsumablePotency?: number
  perkMultiplier?: number
}

@Injectable({
  providedIn: 'root',
})
export class NwExpressionContextService {
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
}
