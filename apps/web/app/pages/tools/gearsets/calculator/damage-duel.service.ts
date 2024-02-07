import { Injectable } from '@angular/core'
import { BehaviorSubject, defer } from 'rxjs'
import { Mannequin } from '~/nw/mannequin'

@Injectable()
export class DamageDuelService {
  public readonly player$ = defer(() => this.playerSubject.asObservable())
  public readonly opponent$ = defer(() => this.opponentSubject.asObservable())
  private playerSubject = new BehaviorSubject<Mannequin>(null)
  private opponentSubject = new BehaviorSubject<Mannequin>(null)

  public setPlayer(mannequin: Mannequin) {
    this.playerSubject.next(mannequin)
  }

  public setOpponent(mannequin: Mannequin) {
    this.opponentSubject.next(mannequin)
  }
}
