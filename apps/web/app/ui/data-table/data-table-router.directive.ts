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
    private parent: DataTableComponent<any>,
    private cdRef: ChangeDetectorRef
  ) {
    //
  }

  public ngOnInit(): void {
    if (this.route.firstChild) {
      this.parent.selection = [this.route.firstChild.snapshot.paramMap.get('id')]
      this.cdRef.markForCheck()
    }
    this.parent.selectionChange
      .pipe<string[]>(distinctUntilChanged(isEqual))
      .pipe(takeUntil(this.destroy$))
      .subscribe((selection) => {
        // const params = this.route.snapshot.params

        this.router.navigate([selection?.[0] || '/'], {
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
