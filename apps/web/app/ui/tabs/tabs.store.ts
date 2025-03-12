import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'

export interface TabsState {
  active: any
}
export const TabsStore = signalStore(
  withState<TabsState>({
    active: null,
  }),
  withMethods((state) => {
    return {
      activate: (value: any) => {
        patchState(state, { active: value })
      },
    }
  }),
)
