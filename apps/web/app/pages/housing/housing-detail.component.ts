import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Housingitems } from '@nw-data/types'
import { combineLatest, distinctUntilChanged, map, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-housing-detail',
  templateUrl: './housing-detail.component.html',
  styleUrls: ['./housing-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content'
  }
})
export class HousingDetailComponent implements OnInit, OnDestroy {
  public itemId: string
  public item: Housingitems

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private route: ActivatedRoute, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    const id$ = this.route.paramMap.pipe(map((params) => params.get('id'))).pipe(distinctUntilChanged())

    combineLatest({
      id: id$,
      items: this.nw.db.housingItemsMap,
    })
      .pipe(map(({ items, id }) => items.get(id)))
      .pipe(takeUntil(this.destroy$))
      .subscribe((item) => {
        this.item = item
        this.itemId = item?.HouseItemID
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
