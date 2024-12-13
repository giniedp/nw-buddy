import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { EmoteData } from '@nw-data/generated'
import { combineLatest, Observable, of } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { rejectKeys } from '~/utils'

export interface EmotesDetailState {
  emoteId: string
  emote: EmoteData
}

export const EmotesDetailStore = signalStore(
  withState<EmotesDetailState>({
    emoteId: null,
    emote: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (data: Pick<EmotesDetailState, 'emoteId'>): Observable<EmotesDetailState> =>
        combineLatest({
          emoteId: of(data.emoteId),
          emote: db.emotesById(data.emoteId),
        }),
    }
  }),
  withComputed(({ emote }) => {
    return {
      name: computed(() => emote()?.DisplayName),
      description: computed(() => emote()?.DisplayDescription),
      icon: computed(() => emote()?.UiImage),
      group: computed(() => emote()?.DisplayGroup),
      properties: computed(() => selectProperties(emote())),
    }
  }),
)

function selectProperties(item: EmoteData) {
  const reject: Array<keyof EmoteData> = ['DisplayName', 'DisplayGroup', 'UiImage', 'DisplayDescription']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}
