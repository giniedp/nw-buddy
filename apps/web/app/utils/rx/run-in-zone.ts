import { NgZone } from '@angular/core'
import { Observable, OperatorFunction } from 'rxjs'

export function runInZone<T>(zone: NgZone): OperatorFunction<T, T> {
  return (source) => {
    return new Observable((observer) => {
      return source.subscribe({
        next: (value) => zone.run(() => observer.next(value)),
        error: (err) => zone.run(() => observer.error(err)),
        complete: () => zone.run(() => observer.complete()),
      })
    })
  }
}

export function runOutsideZone<T>(zone: NgZone): OperatorFunction<T, T> {
  return (source) => {
    return new Observable((observer) => {
      return source.subscribe({
        next: (value) => zone.runOutsideAngular(() => observer.next(value)),
        error: (err) => zone.runOutsideAngular(() => observer.error(err)),
        complete: () => zone.runOutsideAngular(() => observer.complete()),
      })
    })
  }
}
