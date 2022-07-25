import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { Subject } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeComponent implements OnInit, OnDestroy {
  public get skills() {
    return this.nw.tradeskills.skills
  }

  public get categories() {
    return this.nw.tradeskills.categories
  }

  public selected: string

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public skillsByCategory(name: string) {
    return this.nw.tradeskills.skillsByCategory(name)
  }

  public ngOnInit(): void {}

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public isActive(category: string, index: number) {
    if (!this.selected) {
      return index == 0
    }
    return this.selected === category
  }
}
