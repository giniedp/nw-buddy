import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { PlayerTitleData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'
import { rejectKeys } from '~/utils'

export interface PlayerTitleDetailState {
  recordId: string
  record: PlayerTitleData
}

export const PlayerTitleDetailStore = signalStore(
  withState<PlayerTitleDetailState>({
    recordId: null,
    record: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      async load(recordId: string) {
        return {
          recordId,
          record: await db.playerTitlesById(recordId),
        }
      },
    }
  }),
  withComputed(({ record }) => {
    return {
      recordId: computed(() => record()?.TitleID),
      type: computed(() => record()?.TitleType),
      title: computed(() => record()?.TitleMale),
      titleFemale: computed(() => record()?.TitleFemale),
      titleNeutral: computed(() => record()?.TitleNeutral),
      description: computed(() => record()?.Description),
      properties: computed(() => selectProperties(record())),
    }
  }),
)

function selectProperties(item: PlayerTitleData) {
  const reject: Array<keyof PlayerTitleData> = ['TitleMale', 'TitleFemale', 'TitleNeutral', 'Description', 'TitleType']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
