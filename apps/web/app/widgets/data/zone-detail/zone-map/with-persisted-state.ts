import { effect, inject, untracked } from '@angular/core'
import { getState, patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals'
import { pick } from 'lodash'
import { PreferencesService } from '~/preferences'

/**
 * Restores the given state keys from the user preferences on init and saves them on every change
 */
export function withPersistedState<State extends object>(key: string, keys: Array<keyof State & string>) {
  return signalStoreFeature(
    { state: type<State>() },
    withHooks((store) => {
      const preferences = inject(PreferencesService)
      return {
        onInit() {
          const saved = preferences.storage.get<Partial<State>>(key)
          if (saved && typeof saved === 'object') {
            patchState(store, pick(saved, keys) as Partial<State>)
          }
          effect(() => {
            const value = pick(getState(store), keys)
            untracked(() => {
              preferences.storage.set(key, value)
            })
          })
        },
      }
    }),
  )
}
