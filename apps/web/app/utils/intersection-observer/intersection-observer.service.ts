import { Injectable } from '@angular/core'
import { isEqual } from 'lodash'

import { BehaviorSubject, Observable, of, ReplaySubject, Subject } from 'rxjs'
import { filter, share, switchMap, take } from 'rxjs/operators'

export type IntersectionObserverResult =
  | {
      supported: true
      entry: IntersectionObserverEntry
    }
  | {
      supported: false
    }

interface DispatcherInstance {
  instance: IntersectionObserver
  subjects: Map<
    Element,
    {
      shared: Observable<IntersectionObserverResult>
      dispatch: Subject<IntersectionObserverResult>
    }
  >
}

@Injectable({ providedIn: 'root' })
export class IntersectionObserverService {
  public readonly isSupported = typeof IntersectionObserver !== 'undefined'

  private enabled = new BehaviorSubject<boolean>(true)
  private dispatcher = new Map<IntersectionObserverInit, DispatcherInstance>()
  private dispatch = (key: IntersectionObserverInit, entries: IntersectionObserverEntry[]) => {
    const subs = this.dispatcher.get(key).subjects
    entries.forEach((entry) => {
      if (subs && subs.has(entry.target)) {
        subs.get(entry.target).dispatch.next({
          supported: true,
          entry: entry,
        })
      }
    })
  }

  /**
   * Runs some logic with intersection observer disabled
   */
  public withoutObservation(fn: () => void) {
    this.enabled.next(false)
    try {
      fn()
    } catch (err) {
      console.error(err)
    }
    this.enabled.next(true)
  }

  /**
   * Creates a new and unshared IntersectionObserver instance
   */
  public create(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    return new IntersectionObserver(cb, options)
  }

  public observe(element: Element, config?: IntersectionObserverInit): Observable<IntersectionObserverResult> {
    if (!this.isSupported) {
      return of({ supported: false })
    }
    return of(this.getObserverKey(config)).pipe(switchMap((key) => this.sharedObserverFor(element, key)))
  }

  public onceVisible(element: Element, config?: IntersectionObserverInit) {
    return this.observe(element, config)
      .pipe(filter((it) => it.supported && it.entry.isIntersecting))
      .pipe(take(1))
  }

  public onceUnsupportedOrVisible(element: Element, config?: IntersectionObserverInit) {
    return this.observe(element, config)
      .pipe(filter((it) => !it.supported || it.entry.isIntersecting))
      .pipe(take(1))
  }

  private sharedObserverFor(el: Element, key: IntersectionObserverInit) {
    const found = this.dispatcher.get(key)?.subjects?.get(el)?.shared
    if (found) {
      return found
    }
    const shared = new Observable<IntersectionObserverResult>((sub) => {
      const dispatcher = this.acquire(el, key)
      dispatcher.shared = shared
      dispatcher.dispatch.subscribe((it) => sub.next(it))
      return () => {
        dispatcher.shared = null
        dispatcher.dispatch.complete()
        this.release(el, key)
      }
    }).pipe(share())
    return shared
  }

  private acquire(el: Element, key: IntersectionObserverInit) {
    if (!this.dispatcher.has(key)) {
      this.dispatcher.set(key, {
        instance: this.create((entries) => this.dispatch(key, entries), key),
        subjects: new Map(),
      })
    }
    const reg = this.dispatcher.get(key)
    if (reg.subjects.has(el)) {
      throw new Error('element is already being observed')
    }
    reg.subjects.set(el, {
      dispatch: new ReplaySubject(1),
      shared: null,
    })
    reg.instance.observe(el)
    return reg.subjects.get(el)
  }

  private release(el: Element, key: IntersectionObserverInit) {
    const reg = this.dispatcher.get(key)
    if (reg.subjects.has(el)) {
      reg.subjects.delete(el)
    }
    reg.instance.unobserve(el)
    if (!reg.subjects.size) {
      reg.instance.disconnect()
      this.dispatcher.delete(key)
    }
  }

  private getObserverKey(config?: IntersectionObserverInit) {
    config = { ...(config || {}) }
    const found = Array.from(this.dispatcher.keys()).find((it) => isEqual(it, config))
    if (found) {
      return found
    }
    return config
  }
}
