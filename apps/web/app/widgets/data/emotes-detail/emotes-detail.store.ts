import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NwDbService } from '~/nw'

@Injectable()
export class EmotesDetailStore extends ComponentStore<{ emoteId: string }> {
  protected db = inject(NwDbService)
  public readonly emoteId$ = this.select(({ emoteId }) => emoteId)

  @Output()
  public readonly emote$ = this.select(this.db.emote(this.emoteId$), (it) => it)

  public readonly name$ = this.select(this.emote$, (it) => it?.DisplayName)
  public readonly description$ = this.select(this.emote$, (it) => it?.DisplayDescription)
  public readonly icon$ = this.select(this.emote$, (it) => it?.UiImage)

  public constructor() {
    super({ emoteId: null })
  }

  public update(emoteId: string) {
    this.patchState({ emoteId: emoteId })
  }
}
