import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, Subject, takeUntil } from 'rxjs'
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

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {

  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
