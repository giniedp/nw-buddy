import { ChangeDetectorRef, Directive, Input, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { isEqual } from 'lodash'
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs'
import { DataTableComponent } from './data-table.component'

@Directive({
  selector: '[nwbTableRouter],[nwbTableRouterParam]',
})
export class DataTableRouterDirective implements OnInit, OnDestroy {
  @Input()
  public nwbTableRouterParam = 'id'

  private destroy$ = new Subject()

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private table: DataTableComponent<any>,
    private cdRef: ChangeDetectorRef
  ) {
    //
  }

  public ngOnInit(): void {
    if (this.route.firstChild) {
      const toSelect = this.route.firstChild.snapshot.paramMap.get(this.nwbTableRouterParam)
      if (toSelect) {
        this.table.select([toSelect])
        this.cdRef.markForCheck()
      }
    }
    this.table.selection
      .pipe<string[]>(distinctUntilChanged(isEqual))
      .pipe(takeUntil(this.destroy$))
      .subscribe((selection) => {
        this.router.navigate([selection?.[0] || '.'], {
          relativeTo: this.route,
          queryParamsHandling: 'preserve',
        })
      })

  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
