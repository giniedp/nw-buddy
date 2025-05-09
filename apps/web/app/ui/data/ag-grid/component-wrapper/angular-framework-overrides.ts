import { FrameworkOverridesIncomingSource, VanillaFrameworkOverrides } from '@ag-grid-community/core'
import { Injectable, NgZone } from '@angular/core'
import { injectWindow } from '~/utils/injection/window'

@Injectable()
export class AngularFrameworkOverrides extends VanillaFrameworkOverrides {
  private window = injectWindow()
  // Flag used to control Zone behaviour when running tests as many test features rely on Zone.
  private isRunningWithinTestZone: boolean = false

  private runOutside: <T>(callback: () => T, source?: FrameworkOverridesIncomingSource) => T

  constructor(private _ngZone: NgZone) {
    super('angular')

    this.isRunningWithinTestZone =
      (this.window as any)?.AG_GRID_UNDER_TEST ?? !!(this.window as any)?.Zone?.AsyncTestZoneSpec

    if (!this._ngZone) {
      this.runOutside = (callback) => callback()
    } else if (this.isRunningWithinTestZone) {
      this.runOutside = (callback, source) => {
        if (source === 'resize-observer') {
          // ensure resize observer callbacks are run outside of Angular even under test due to Jest not supporting ResizeObserver
          // which means it just loops continuously with a setTimeout with no way to flush the queue or have fixture.whenStable() resolve.
          return this._ngZone.runOutsideAngular(callback)
        }
        // When under test run inside Angular so that tests can use fixture.whenStable() to wait for async operations to complete.
        return callback()
      }
    } else {
      this.runOutside = (callback) => this._ngZone.runOutsideAngular(callback)
    }
  }

  // Make all events run outside Angular as they often trigger the setup of event listeners
  // By having the event listeners outside Angular we can avoid triggering change detection
  // This also means that if a user calls an AG Grid API method from within their component
  // the internal side effects will not trigger change detection. Without this the events would
  // run inside Angular and trigger change detection as the source of the event was within the angular zone.
  override wrapIncoming: <T>(callback: () => T, source?: FrameworkOverridesIncomingSource) => T = (callback, source) =>
    this.runOutside(callback, source)

  // Only setup wrapping when the call is coming from within Angular zone, i.e from a users application code.
  // Used to distinguish between user code and AG Grid code setting up events against RowNodes and Columns
  override get shouldWrapOutgoing() {
    return this._ngZone && NgZone.isInAngularZone()
  }

  /**
   * Make sure that any code that is executed outside of AG Grid is running within the Angular zone.
   * This means users can update templates and use binding without having to do anything extra.
   */
  override wrapOutgoing: <T>(callback: () => T) => T = (callback) => this.runInsideAngular(callback)

  override isFrameworkComponent(comp: any): boolean {
    if (!comp) {
      return false
    }
    const prototype = comp.prototype
    const isAngularComp = prototype && 'agInit' in prototype
    return isAngularComp
  }

  runInsideAngular<T>(callback: () => T): T {
    // Check for _ngZone existence as it is not present when Zoneless
    return this._ngZone ? this._ngZone.run(callback) : callback()
  }

  runOutsideAngular<T>(callback: () => T, source?: FrameworkOverridesIncomingSource): T {
    return this.runOutside(callback, source)
  }
}
