import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, debounceTime, defer, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { PreferencesService, StorageNode } from '~/preferences'
import { CollectionState, UpgradeStep, calculateSteps, createState, updateState } from './utils'
import { getItemIconPath } from '~/nw/utils'

export interface UmbralCalculatorState {
  marker?: UpgradeStep
}

@Injectable({
  providedIn: 'root',
})
export class UmbralCalculatorService extends ComponentStore<UmbralCalculatorState> {
  public shardItem = this.select(this.db.item('UmbralShardT1'), (item) => item)
  public shardIcon = this.select(this.shardItem, (item) => getItemIconPath(item))
  public upgrades = this.select(this.db.data.umbralgsupgrades(), (items) => items)
  public state = this.select(defer(() => this.getSource()) , this.upgrades, updateState)
  public steps = this.select(this.state.pipe(debounceTime(500)), this.upgrades, calculateSteps)
  public marker = this.select((state) => state.marker)

  private storage: StorageNode

  public constructor(private db: NwDbService, pref: PreferencesService) {
    super({})
    this.storage = pref.storage.storageObject('umbral-calculator')
  }

  public writeScore(id: string, score: number) {
    this.storage.set(id, score)
  }

  public setMarker(marker: UpgradeStep) {
    this.patchState({ marker: marker})
  }

  private getSource() {
    return combineLatest(
      createState().items.map((it) => {
        return this.storage.observe<number>(it.id).pipe(
          map((data) => {
            it.score = data.value || 0
            return it
          })
        )
      })
    ).pipe(
      map((items): CollectionState => {
        return {
          items: items,
          score: 0,
        }
      })
    )
  }
}
