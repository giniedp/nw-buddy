import { DOCUMENT } from '@angular/common'
import { Inject, Injectable } from '@angular/core'
import { EventManager } from '@angular/platform-browser'
import { Observable } from 'rxjs'

export type Options = {
  element?: HTMLElement
  keys: string
}

@Injectable({ providedIn: 'root' })
export class Hotkeys {
  public constructor(
    private eventManager: EventManager,
    @Inject(DOCUMENT)
    private document: Document,
  ) {
    //
  }

  observe(options: Partial<Options>) {
    const keys = options.keys
    const element = options.element || (this.document as any)
    const event = `keydown.${keys}`

    return new Observable((observer) => {
      const handler = (e: Event) => {
        e.preventDefault()
        observer.next(e)
      }

      const dispose = this.eventManager.addEventListener(element, event, handler)

      return () => {
        dispose()
      }
    })
  }
}
