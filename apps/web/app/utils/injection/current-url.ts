import { Location } from '@angular/common'
import { InjectionToken, inject } from '@angular/core'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, defer } from 'rxjs'

export const CURRENT_URL = new InjectionToken<Observable<string>>('CURRENT_URL', {
  providedIn: 'root',
  factory: () => {
    const router = inject(Router)
    const location = inject(Location)
    const subject = new BehaviorSubject(router.url)

    location.onUrlChange((url) => {
      console.log(router.url, url)
      subject.next(url)
    })
    return defer(() => subject)
  },
})

export function injectCurrentUrl() {
  return inject(CURRENT_URL)
}
