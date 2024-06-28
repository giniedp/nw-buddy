import { inject, InjectionToken } from '@angular/core'
import { injectWindow } from './window'

export const NAVIGATOR = new InjectionToken<Navigator>('An abstraction over window.navigator object', {
  factory: () => injectWindow().navigator,
})

export function injectNavigator(): Navigator {
  return inject(NAVIGATOR)
}
