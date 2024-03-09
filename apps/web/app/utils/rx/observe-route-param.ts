import { Injector, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, NavigationEnd, NavigationExtras, Router } from '@angular/router'
import { eq } from 'lodash'
import { Observable, defer, distinctUntilChanged, filter, isObservable, map, of, startWith, switchMap } from 'rxjs'

export function injectRouteParam(
  param: string | Observable<string>,
  route = inject(ActivatedRoute),
): Observable<string> {
  return observeRouteParam(route, param)
}

export function injectChildRouteParam(
  param: string | Observable<string>,
  router = inject(Router),
  route = inject(ActivatedRoute),
): Observable<string> {
  return observeChildRouteParam(router, route, param)
}

export function injectQueryParam(
  param: string | Observable<string>,
  route: ActivatedRoute = inject(ActivatedRoute),
): Observable<string> {
  return observeQueryParam(route, param)
}

export function injectUrlParams(pattern: string): Observable<Record<string, string>>
export function injectUrlParams<T>(pattern: string, project: (it: Record<string, string>) => T): Observable<T>
export function injectUrlParams(pattern: string, project?: (it: Record<string, string>) => any): any {
  return observeUrlParams(inject(Router), pattern).pipe(map(project || ((it) => it)))
}

export function observeRouteParam<T>(route: ActivatedRoute, param: string | Observable<string>): Observable<string> {
  if (!isObservable(param)) {
    param = of(param)
  }
  return param.pipe(switchMap((key) => route.paramMap.pipe(map((map) => map.get(key)))))
}

export function observeQueryParam(route: ActivatedRoute, param: string | Observable<string>) {
  if (!isObservable(param)) {
    param = of(param)
  }
  return param.pipe(switchMap((key) => route.queryParamMap.pipe(map((map) => map.get(key)))))
}

export function injectRouteChange<T>(fn: (router: Router, route: ActivatedRoute) => Observable<T>) {
  return observeRouteChange(inject(Router), inject(ActivatedRoute), fn)
}
export function observeRouteChange<T>(
  router: Router,
  route: ActivatedRoute,
  fn: (router: Router, route: ActivatedRoute) => Observable<T>,
) {
  return router.events.pipe(filter((it) => it instanceof NavigationEnd)).pipe(switchMap(() => fn(router, route)))
}

export function observeChildRouteParam(router: Router, route: ActivatedRoute, param: string | Observable<string>) {
  return defer(() => (isObservable(param) ? param : of(param))).pipe(
    switchMap((param) => {
      return router.events.pipe(filter((it) => it instanceof NavigationEnd)).pipe(
        map(() => getChildRouteParam(route, param)),
        distinctUntilChanged(),
        startWith(getChildRouteParam(route, param)),
      )
    }),
  )
}

export function observeUrlParams(router: Router, pattern: string): Observable<Record<string, string>> {
  function resolve() {
    const tokens1 = router.url.split('?')[0].split('/')
    const tokens2 = pattern.split('/')
    const result: Record<string, string> = {}
    for (let i = 0; i < tokens2.length; i++) {
      const token = tokens2[i]
      if (token.startsWith(':')) {
        result[token.slice(1)] = tokens1[i]
      }
    }
    return result
  }
  return router.events.pipe(
    filter((it) => it instanceof NavigationEnd),
    map(() => resolve()),
    startWith(resolve()),
    distinctUntilChanged(eq),
  )
}

function childRouteConfigWithParam(route: ActivatedRoute, param: string) {
  const regex = new RegExp(`:${param}`)
  return route.routeConfig.children?.find((it) => it.path.match(regex))
}
function childRouteWithParam(route: ActivatedRoute, param: string) {
  const config = childRouteConfigWithParam(route, param)
  return route.children?.find((it) => it.routeConfig === config)
}
function getChildRouteParam(route: ActivatedRoute, param: string) {
  const childRoute = childRouteWithParam(route, param)
  return childRoute?.snapshot?.paramMap?.get(param)
}

export function queryParamModel(
  param: string,
  options?: {
    router?: Router;
    route?: ActivatedRoute;
    injector?: Injector
  },
) {
  const router = options?.router || inject(Router)
  const route = options?.route || inject(ActivatedRoute)
  const param$ = injectQueryParam(param, route)
  const getter = toSignal(param$, {
    injector: options?.injector,
  })
  const setter = (value: string, extras?: NavigationExtras) => {
    return router.navigate(['.'], {
      queryParams: {
        [param]: value,
      },
      relativeTo: route,
      queryParamsHandling: 'merge',
      ...(extras || {}),
    })
  }

  return {
    name: param,
    $: param$,
    value: getter,
    update: setter,
    model: {
      get value(): string {
        return getter()
      },
      set value(value: string) {
        setter(value, {
          replaceUrl: true,
        })
      }
    }
  }

}
