import { ActivatedRoute } from '@angular/router'
import { isObservable, map, Observable, of, switchMap } from 'rxjs'

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
