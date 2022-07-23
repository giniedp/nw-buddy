import { Injectable } from '@angular/core'
import { combineLatest, debounce, debounceTime, defer, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/core/nw'
import { PreferencesService, StorageNode } from '~/core/preferences'
import { shareReplayRefCount } from '~/core/utils'
import { calculateSteps, CollectionState, createState, updateState } from './utils'

@Injectable({
  providedIn: 'root',
})
export class UmbralCalculatorService {
  public shardItem = defer(() => this.db.item('UmbralShardT1')).pipe(shareReplayRefCount(1))
  public upgrades = defer(() => this.db.data.umbralgsupgrades()).pipe(shareReplayRefCount(1))
  public state = defer(() =>
    combineLatest({
      upgrades: this.upgrades,
      state: this.source,
    })
  )
    .pipe(map(({ upgrades, state }) => updateState(state, upgrades)))
    .pipe(shareReplayRefCount(1))

  public steps = defer(() =>
    combineLatest({
      upgrades: this.upgrades,
      state: this.state,
    })
  )
    .pipe(debounceTime(500))
    .pipe(map(({ state, upgrades }) => calculateSteps(state, upgrades)))
    .pipe(shareReplayRefCount(1))

  private source = defer(() => of(createState()))
    .pipe(
      switchMap((state) => {
        return combineLatest(
          state.items.map((it) => {
            return this.storage.observe<number>(it.id).pipe(
              map((data) => {
                it.score = data.value || 0
                return it
              })
            )
          })
        )
      })
    )
    .pipe(
      map((items): CollectionState => {
        return {
          items: items,
          score: 0,
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  private storage: StorageNode

  public constructor(private db: NwDbService, pref: PreferencesService) {
    this.storage = pref.storage.storageObject('umbral-calculator')
  }

  public writeScore(id: string, score: number) {
    this.storage.set(id, score)
  }
}
