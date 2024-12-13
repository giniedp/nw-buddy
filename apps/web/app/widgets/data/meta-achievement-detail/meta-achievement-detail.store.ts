import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { MetaAchievementData } from '@nw-data/generated'
import { combineLatest } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { humanize, rejectKeys } from '~/utils'

export interface MetaAchievementDetailState {
  record: MetaAchievementData
}

export const MetaAchievementDetailStore = signalStore(
  withState<MetaAchievementDetailState>({
    record: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (id: string) =>
        combineLatest({
          record: db.metaAchievementsById(id),
        }),
    }
  }),
  withComputed(({ record }) => {
    return {
      achievementId: computed(() => record()?.AchievementsID),
      icon: computed(() => record()?.Icon || NW_FALLBACK_ICON),
      title: computed(() => record()?.Title),
      description: computed(() => record()?.Description),
      displayCategory: computed(() => humanize(record()?.UIDisplayCategory)),
      tierLabel: computed(() => record()?.Tier),
      properties: computed(() => selectProperties(record())),
    }
  }),
)

function selectProperties(item: MetaAchievementData) {
  const reject: Array<keyof MetaAchievementData> = ['Title', 'Description', 'Icon', 'UIDisplayCategory', 'Tier']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}
