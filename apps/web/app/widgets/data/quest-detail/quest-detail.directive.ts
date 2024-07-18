import { Directive, forwardRef, Input, Output } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { patchState } from '@ngrx/signals'
import { QuestDetailStore } from './quest-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbQuestDetail]',
  exportAs: 'questDetail',
  providers: [
    {
      provide: QuestDetailStore,
      useExisting: forwardRef(() => QuestDetailDirective),
    },
  ],
})
export class QuestDetailDirective extends QuestDetailStore {
  @Input()
  public set nwbQuestDetail(value: string) {
    patchState(this, { questId: value })
  }

  @Output()
  public nwbQuestChange = toObservable(this.quest)
}
