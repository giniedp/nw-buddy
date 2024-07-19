import { inject } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { NwDataService } from '~/data'
import { selectSignal } from '~/utils'

export interface AchievementDetailState {
  achievementId: string
}
export const AchievementDetailStore = signalStore(
  withState<AchievementDetailState>({
    achievementId: null,
  }),
  withComputed(({ achievementId }) => {
    const db = inject(NwDataService)
    return {
      achievement: selectSignal(db.achievement(achievementId)),
    }
  }),
)
