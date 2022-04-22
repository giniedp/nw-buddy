import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { distinctUntilChanged, map, Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'nwb-crafting-detail',
  templateUrl: './crafting-detail.component.html',
  styleUrls: ['./crafting-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingDetailComponent implements OnInit, OnDestroy {
  public itemId: string

  private destroy$ = new Subject()

  public constructor(private route: ActivatedRoute, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(map((params) => params.get('id')))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {

        this.itemId = id
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
