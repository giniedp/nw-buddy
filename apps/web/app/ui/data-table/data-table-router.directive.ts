import { ChangeDetectorRef, Directive, Input, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Route, Router } from '@angular/router'
import { isEqual } from 'lodash'
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs'
import { DataTableComponent } from './data-table.component'

@Directive({
  standalone: true,
  selector: 'nwb-data-table[detailRoutParam]',
})
export class DataTableRouterDirective implements OnInit, OnDestroy {
  @Input()
  public detailRoutParam = 'id'

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
    const childConfig = this.childRouteConfig()
    const childRoute = this.childRoute()
    const toSelect = (childRoute || this.route).snapshot.paramMap.get(this.detailRoutParam)
      if (toSelect) {
        this.table.select([toSelect])
        this.cdRef.markForCheck()
      }
    this.table.selection
      .pipe<string[]>(distinctUntilChanged(isEqual))
      .pipe(takeUntil(this.destroy$))
      .subscribe((selection) => {
        const target = this.navigationTarget(selection?.[0], childConfig)
        this.router.navigate([target || '.'], {
          relativeTo: this.route,
          queryParamsHandling: 'preserve',
        })
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  private childRouteConfig() {
    return this.route.routeConfig.children?.find((it) => it.path.match(new RegExp(`:${this.detailRoutParam}`)))
  }

  private childRoute() {
    const config = this.childRouteConfig()
    return this.route.children?.find((it) => it.routeConfig === config)
  }

  private paramSnapshot() {

  }

  private navigationTarget(selection: string, route: Route) {
    if (route) {
      return selection ? route.path.replace(`:${this.detailRoutParam}`, selection) : null
    }
    const params = {
      ...this.route.snapshot.params,
      [this.detailRoutParam]: selection
    }
    if (!selection) {
      delete params[this.detailRoutParam]
    }
    return params
  }
}
