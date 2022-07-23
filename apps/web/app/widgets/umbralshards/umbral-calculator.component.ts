import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, OnDestroy, OnInit, TrackByFunction
} from '@angular/core'
import { Subject, takeUntil } from 'rxjs'
import { UmbralCalculatorService } from './umbral-calculator.service'
import { ItemState } from './utils'

@Component({
  selector: 'nwb-umbral-calculator',
  templateUrl: './umbral-calculator.component.html',
  styleUrls: ['./umbral-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UmbralCalculatorComponent implements OnInit, OnChanges, OnDestroy {
  public trackById: TrackByFunction<ItemState> = (i, row) => {
    return row.id
  }

  protected data1: ItemState[] = []
  protected data2: ItemState[] = []
  protected upgradeNext: ItemState[]
  protected totalGS: number = null

  private destroy$ = new Subject()

  public constructor(private service: UmbralCalculatorService, private cdRef: ChangeDetectorRef) {

  }

  public ngOnInit(): void {
    this.service.state
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.totalGS = state.score
        this.data1 = state.items.slice(0, 5)
        this.data2 = state.items.slice(5, 10)
        this.upgradeNext = state.items.filter((it) => it.upgrade)
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(): void {}

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public writeValue(id: string, value: number) {
    this.service.writeScore(id, value)
  }
}
