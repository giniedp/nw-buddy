import { Injectable } from '@angular/core'
import { BehaviorSubject, defer, tap } from 'rxjs'
import { shareReplayRefCount } from '~/utils'

@Injectable({
  providedIn: 'root',
})
export class QuicksearchService {
  public get value() {
    return this.value$.value
  }
  public set value(v: string) {
    this.value$.next(v)
  }

  public readonly query = defer(() => this.value$)
    .pipe(
      tap({
        subscribe: () => this.active$.next(true),
        unsubscribe: () => {
          this.active$.next(false)
          this.value$.next('')
        },
      })
    )
    .pipe(shareReplayRefCount(1))

  public readonly active = defer(() => this.active$)

  private value$ = new BehaviorSubject('')
  private active$ = new BehaviorSubject(false)
}
