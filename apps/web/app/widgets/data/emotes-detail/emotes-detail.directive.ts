import { Directive, forwardRef, Input } from '@angular/core'
import { EmotesDetailStore } from './emotes-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbEmoteDetail]',
  exportAs: 'emoteDetail',
  providers: [
    {
      provide: EmotesDetailStore,
      useExisting: forwardRef(() => EmotesDetailDirective),
    },
  ],
})
export class EmotesDetailDirective extends EmotesDetailStore {
  @Input()
  public set nwbEmoteDetail(value: string) {
    this.patchState({ emoteId: value })
  }
}
