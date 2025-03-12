import { Directive, Input, input } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { ActivatedRoute, NavigationEnd, Route, Router } from '@angular/router'
import { isEqual } from 'lodash'
import { NEVER, ReplaySubject, distinctUntilChanged, filter, map, merge, of, startWith, switchMap, tap } from 'rxjs'
import { TableGridStore } from '../table-grid.store'

@Directive({
  standalone: true,
  selector: 'nwb-table-grid[selectionRouteParam]',
})
export class DataGridSelectionRouteParamDirective {
  public selectionRouteParam = input<string>(null)
  private selectionRouteParam$ = toObservable(this.selectionRouteParam)
  private selection$ = toObservable(this.store.selection)

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: TableGridStore<unknown>,
  ) {
    this.selectionRouteParam$
      .pipe(switchMap((param) => (param ? of(param) : NEVER)))
      .pipe(switchMap((param) => merge(this.handleRouteChange(param), this.handleSelectionChange(param))))
      .pipe(takeUntilDestroyed())
      .subscribe()
  }

  private handleSelectionChange(param: string) {
    const childConfig = this.childRouteConfig(param)
    return this.selection$.pipe(
      map((it) => it?.[0]),
      distinctUntilChanged(isEqual),
      tap((selection) => {
        const target = this.navigationTarget(selection, childConfig, param)
        this.router.navigate([target || '.'], {
          relativeTo: this.route,
          queryParamsHandling: 'preserve',
          preserveFragment: true,
        })
      }),
    )
  }

  private handleRouteChange(param: string) {
    return this.router.events.pipe(filter((it) => it instanceof NavigationEnd)).pipe(
      map(() => this.getRouteId(param)),
      distinctUntilChanged(),
      startWith(this.getRouteId(param)),
      tap((value) => {
        this.store.patchState({
          selection: value ? [value] : [],
        })
      }),
    )
  }

  private childRouteConfig(param: string) {
    return this.route.routeConfig.children?.find((it) => it.path.match(new RegExp(`:${param}`)))
  }

  private childRoute(param: string) {
    const config = this.childRouteConfig(param)
    return this.route.children?.find((it) => it.routeConfig === config)
  }

  private getRouteId(param: string) {
    const childRoute = this.childRoute(param)
    return (childRoute || this.route).snapshot.paramMap.get(param)
  }

  private navigationTarget(selection: string, route: Route, param: string) {
    if (route) {
      return selection ? route.path.replace(`:${param}`, selection) : null
    }
    const params = {
      ...this.route.snapshot.params,
      [param]: selection,
    }
    if (!selection) {
      delete params[param]
    }
    return params
  }
}
