import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core'
import { combineLatest, map } from 'rxjs'
import { UmbralCalculatorService } from './umbral-calculator.service'
import { CollectionState, ItemState, UpgradeStep } from './utils'

@Component({
  selector: 'nwb-umbral-calculator',
  templateUrl: './umbral-calculator.component.html',
  styleUrls: ['./umbral-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UmbralCalculatorComponent {
  public trackByIndex = (i: number) => i

  protected vm$ = combineLatest({
    state: this.service.collection,
    marker: this.service.marker,
    shardIcon: this.service.shardIcon,
  }).pipe(
    map(({ state, marker, shardIcon }) => {
      return {
        ...selectVm(state, marker),
        shardIcon,
      }
    })
  )

  public constructor(private service: UmbralCalculatorService, private cdRef: ChangeDetectorRef) {}

  public writeValue(id: string, value: number) {
    this.service.writeScore(id, value)
  }
}

function selectVm(state: CollectionState, marker: UpgradeStep) {
  const items1 = state.items.slice(0, 5).map((it) => {
    const scoreTarget = getMaxGsFromUpgrade(marker, it)
    return {
      ...it,
      scoreTarget: scoreTarget,
      scoreDelta: Math.max(0, scoreTarget - it.score),
    }
  })
  const items2 = state.items.slice(5, 10).map((it) => {
    const scoreTarget = getMaxGsFromUpgrade(marker, it)
    return {
      ...it,
      scoreTarget: scoreTarget,
      scoreDelta: Math.max(0, scoreTarget - it.score),
    }
  })
  return {
    upgradeNext: state.items.filter((it) => it.upgrade),
    gsTotal: state.score,
    gsTarget: marker ? marker.score : null,
    costTarget: marker ? marker.shardsTotal : null,
    items1: items1,
    items2: items2,
  }
}

function getMaxGsFromUpgrade(step: UpgradeStep, item: ItemState) {
  if (!step) {
    return null
  }
  const items = step.state.items.filter((it) => it.id === item.id)
  return items[items.length - 1]?.score
}
