import { Injectable, NgZone } from '@angular/core'
import { VanillaFrameworkOverrides } from '@ag-grid-community/core'
import { AgPromise } from '@ag-grid-community/core'

@Injectable({ providedIn: 'root' })
export class AngularFrameworkOverrides extends VanillaFrameworkOverrides {

  constructor(private ngZone: NgZone) {
    // @ts-ignore
    super('angular')
  }

  public override setTimeout(action: any, timeout?: any): void {
    if (this.ngZone) {
      this.ngZone.runOutsideAngular(() => {
        window.setTimeout(() => {
          action()
        }, timeout)
      })
    } else {
      window.setTimeout(() => {
        action()
      }, timeout)
    }
  }

  public override setInterval(action: any, interval?: any): AgPromise<number> {
    return new AgPromise<number>((resolve) => {
      if (this.ngZone) {
        this.ngZone.runOutsideAngular(() => {
          resolve(
            window.setInterval(() => {
              action()
            }, interval),
          )
        })
      } else {
        resolve(
          window.setInterval(() => {
            action()
          }, interval),
        )
      }
    })
  }

  override addEventListener(
    element: HTMLElement,
    eventType: string,
    listener: EventListener | EventListenerObject,
    useCapture?: boolean,
  ): void {
    if (this.isOutsideAngular(eventType) && this.ngZone) {
      this.ngZone.runOutsideAngular(() => {
        element.addEventListener(eventType, listener, useCapture)
      })
    } else {
      element.addEventListener(eventType, listener, useCapture)
    }
  }

  override dispatchEvent(eventType: string, listener: () => {}, global = false): void {
    if (this.isOutsideAngular(eventType)) {
      if (this.ngZone) {
        this.ngZone.runOutsideAngular(listener)
      } else {
        listener()
      }
    } else if (global) {
      // only trigger off events (and potentially change detection) if actually used
      if (!NgZone.isInAngularZone() && this.ngZone) {
        this.ngZone.run(listener)
      } else {
        listener()
      }
    }
  }

  override isFrameworkComponent(comp: any): boolean {
    if (!comp) {
      return false
    }
    const prototype = comp.prototype
    const isAngularComp = prototype && 'agInit' in prototype
    return isAngularComp
  }
}
