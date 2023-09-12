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
    return this.gs$.value
  }
  public set gs(value: number) {
    this.gs$.next(value)
  }

  public get gsBonus() {
    return this.gsBonus$.value
  }
  public set gsBonus(value: boolean) {
    this.gsBonus$.next(value)
  }

  public value = defer(() =>
    combineLatest({
      level: this.level$,
      gs: this.gs$,
      gsBonus: this.gsBonus$,
    })
  )

  private level$ = new BehaviorSubject(NW_MAX_CHARACTER_LEVEL)
  private gs$ = new BehaviorSubject(650)
  private gsBonus$ = new BehaviorSubject(false)
}
