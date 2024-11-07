import { signalStore, withState } from '@ngrx/signals'
import { AchievementData } from '@nw-data/generated'
import { combineLatest, of } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'

export interface AchievementDetailState {
  achievementId: string
  achievement: AchievementData
}

export const AchievementDetailStore = signalStore(
  withState<AchievementDetailState>({
    achievementId: null,
    achievement: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (data: { achievementId: string }) =>
        combineLatest({
          achievementId: of(data.achievementId),
          achievement: db.achievementsById(data.achievementId),
        }),
    }
  }),
)
