import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, TrackByFunction
} from '@angular/core'
import { defer, map } from 'rxjs'
import { getItemIconPath } from '~/nw/utils'
import { UmbralCalculatorService } from './umbral-calculator.service'
import { ItemState, UpgradeStep } from './utils'

@Component({
  selector: 'nwb-umbral-calculator-steps',
  templateUrl: './umbral-calculator-steps.component.html',
  styleUrls: ['./umbral-calculator-steps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UmbralCalculatorStepsComponent {
  public trackByIndex: TrackByFunction<ItemState> = (i, row) => {
    return i
  }

  public shardIcon = defer(() => this.service.shardItem).pipe(map((it) => getItemIconPath(it)))
  public data$ = defer(() => this.service.steps)

  public constructor(private service: UmbralCalculatorService, private cdRef: ChangeDetectorRef) {

  }

  public upgrade(item: UpgradeStep) {
    item.state.items.forEach((it) => {
      this.service.writeScore(it.id, it.score)
    })
  }
}
