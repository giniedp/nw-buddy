import { signalStore, withState } from '@ngrx/signals'
import { EntitlementData } from '@nw-data/generated'
import { combineLatest, from, Observable, of, switchMap } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { EntitlementReward, selectEntitlementRewards } from './selectors'

export interface EntitlementDetailState {
  entitlementId: string
  entitlement: EntitlementData
  rewards: EntitlementReward[]
}

export const EntitlementDetailStore = signalStore(
  withState<EntitlementDetailState>({
    entitlementId: null,
    entitlement: null,
    rewards: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (data: Pick<EntitlementDetailState, 'entitlementId'>): Observable<EntitlementDetailState> => {
        const record$ = from(db.entitlementsById(data.entitlementId))
        return combineLatest({
          entitlementId: of(data.entitlementId),
          entitlement: record$,
          rewards: record$.pipe(switchMap((it) => selectEntitlementRewards(it, db))),
        })
      },
    }
  }),
)
