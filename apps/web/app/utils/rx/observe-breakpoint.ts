import { BreakpointObserver } from '@angular/cdk/layout'
import { inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Observable, map, startWith } from 'rxjs'

export type MinWidthMediaQuery = `(min-width: ${number}px)`
export type MaxWidthMediaQuery = `(max-width: ${number}px)`
export type BasicMediaQuery = MinWidthMediaQuery | MaxWidthMediaQuery

export function injectBreakpointSignal(query: BasicMediaQuery) {
  return toSignal(injectBreakpoint(query))
}

export function injectBreakpoint(query: BasicMediaQuery): Observable<boolean> {
  return observeBreakpoint(inject(BreakpointObserver), query)
}

export function observeBreakpoint(observer: BreakpointObserver, query: BasicMediaQuery): Observable<boolean> {
  return observer.observe(query).pipe(
    map((state) => state.matches),
    startWith(observer.isMatched(query)),
  )
}
