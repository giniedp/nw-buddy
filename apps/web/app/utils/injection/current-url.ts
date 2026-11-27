import { Location } from '@angular/common'
import { InjectionToken, inject } from '@angular/core'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, Subject, defer, distinctUntilChanged } from 'rxjs'

/**
 * Url changes the router and Location do not see: an embedded app that writes the history itself (the viewer app of
 * the pak page). Its host reports them here, normalized like Location's urls.
 */
export const EXTERNAL_URL_CHANGES = new InjectionToken<Subject<string>>('EXTERNAL_URL_CHANGES', {
  providedIn: 'root',
  factory: () => new Subject<string>(),
})

export const CURRENT_URL = new InjectionToken<Observable<string>>('CURRENT_URL', {
  providedIn: 'root',
  factory: () => {
    const router = inject(Router)
    const location = inject(Location)
    const subject = new BehaviorSubject(router.url)

    location.onUrlChange((url) => {
      subject.next(url)
    })
    inject(EXTERNAL_URL_CHANGES).subscribe((url) => {
      subject.next(url)
    })
    return defer(() => subject).pipe(distinctUntilChanged())
  },
})

export function injectCurrentUrl() {
  return inject(CURRENT_URL)
}
