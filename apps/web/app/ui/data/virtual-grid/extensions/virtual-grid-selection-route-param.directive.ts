import { Directive, Input } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, NavigationEnd, Route, Router } from '@angular/router'
import { isEqual } from 'lodash'
import { NEVER, ReplaySubject, distinctUntilChanged, filter, map, merge, of, startWith, switchMap, tap } from 'rxjs'
import { VirtualGridStore } from '../virtual-grid.store'

@Directive({
  standalone: true,
  selector: 'nwb-virtual-grid[selectionRouteParam]',
})
export class VirtualGridSelectionRouteParamDirective {
  @Input()
  public set selectionRouteParam(value: string) {
    this.selectionRouteParam$.next(value)
  }

  private selectionRouteParam$ = new ReplaySubject<string>(1)

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: VirtualGridStore<unknown>,
  ) {
    this.selectionRouteParam$
      .pipe(switchMap((param) => (param ? of(param) : NEVER)))
      .pipe(switchMap((param) => merge(this.handleRouteChange(param), this.handleSelectionChange(param))))
      .pipe(takeUntilDestroyed())
      .subscribe()
  }

  private handleSelectionChange(param: string) {
    const childConfig = this.childRouteConfig(param)
    return this.store.selection$.pipe(
      map((it) => it?.[0]),
      distinctUntilChanged(isEqual),
      tap((selection) => {
        const target = this.navigationTarget(selection, childConfig, param)
        const urlTree = this.router.createUrlTree([target || '.'], {
          relativeTo: this.route,
          queryParamsHandling: 'preserve',
          preserveFragment: true,
        })
        const isActive = this.router.isActive(urlTree, {
          paths: 'exact',
          queryParams: 'exact',
          matrixParams: 'exact',
          fragment: 'ignored',
        })
        if (isActive) {
          return
        }
        this.router.navigateByUrl(urlTree)
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
