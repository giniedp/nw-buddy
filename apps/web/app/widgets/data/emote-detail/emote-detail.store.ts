import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { EmoteData } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { rejectKeys } from '~/utils'

@Injectable()
export class EmotesDetailStore extends ComponentStore<{ emoteId: string }> {
  protected db = inject(NwDataService)
  public readonly emoteId$ = this.select(({ emoteId }) => emoteId)

  @Output()
  public readonly emote$ = this.select(this.db.emote(this.emoteId$), (it) => it)

  public readonly name$ = this.select(this.emote$, (it) => it?.DisplayName)
  public readonly description$ = this.select(this.emote$, (it) => it?.DisplayDescription)
  public readonly icon$ = this.select(this.emote$, (it) => it?.UiImage)
  public readonly group$ = this.select(this.emote$, (it) => it?.DisplayGroup)
  public readonly properties$ = this.select(this.emote$, selectProperties)

  public constructor() {
    super({ emoteId: null })
  }

  public update(emoteId: string) {
    this.patchState({ emoteId: emoteId })
  }
}

function selectProperties(item: EmoteData) {
  const reject: Array<keyof EmoteData> = ['DisplayName', 'DisplayGroup', 'UiImage', 'DisplayDescription']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
