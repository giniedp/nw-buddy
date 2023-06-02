import { Injectable } from '@angular/core'
import ResizeObserver from 'resize-observer-polyfill'
import { Observable, of, ReplaySubject, Subject } from 'rxjs'

export interface ResizeObserverRect {
  readonly bottom: number
  readonly height: number
  readonly left: number
  readonly right: number
  readonly top: number
  readonly width: number
  readonly x: number
  readonly y: number
}

@Injectable({ providedIn: 'root' })
export class ResizeObserverService {
  public readonly isSupported = typeof ResizeObserver !== 'undefined'

  private observer: ResizeObserver
  private subjects = new Map<Element, Subject<ResizeObserverRect>>()
  private dispatch = (entries: ResizeObserverEntry[]) => {
    entries.forEach((entry) => {
      if (this.subjects.has(entry.target)) {
        this.subjects.get(entry.target).next(entry.contentRect)
      }
    })
  }

  public create(cb: ResizeObserverCallback): ResizeObserver {
    return new ResizeObserver(cb)
  }

  public observe(element: Element): Observable<ResizeObserverRect> {
    const isSupported = typeof ResizeObserver !== 'undefined'
    if (!isSupported) {
      return of(null)
    }
    return new Observable<ResizeObserverRect>((subscriber) => {
      this.observerElement(element).subscribe((value) => {
        subscriber.next(value)
      })
      return () => {
        this.unobserveElement(element)
      }
    })
  }

  private observerElement(el: Element) {
    if (!this.observer) {
      this.observer = this.create(this.dispatch)
    }
    if (!this.subjects.has(el)) {
      this.subjects.set(el, new ReplaySubject(1))
    }
    this.observer.observe(el)
    return this.subjects.get(el)
  }

  private unobserveElement(el: Element) {
    if (this.subjects.has(el)) {
      this.subjects.get(el).complete()
      this.subjects.delete(el)
    }
    this.observer?.unobserve(el)
  }
}
