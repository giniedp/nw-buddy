import { Injectable } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { fromEvent, map, startWith } from 'rxjs'
import { injectDocument } from '~/utils/injection/document'

@Injectable({ providedIn: 'root' })
export class FullscreenService {
  private document = injectDocument()
  private state = fromEvent(this.document, 'fullscreenchange').pipe(
    startWith(null),
    map(() => {
      return {
        active: this.document.fullscreenElement !== null,
        element: this.document.fullscreenElement,
      }
    }),
  )

  public isActive = toSignal(this.state.pipe(map((it) => it.active)))
  public element = toSignal(this.state.pipe(map((it) => it.element)))
  public change$ = toObservable(toSignal(this.state))

  public toggle(element: HTMLElement) {
    if (this.document.fullscreenElement) {
      this.document.exitFullscreen()
    } else {
      element.requestFullscreen()
    }
  }

  public request(element: HTMLElement) {
    element.requestFullscreen()
  }

  public exit() {
    this.document.exitFullscreen()
  }
}
