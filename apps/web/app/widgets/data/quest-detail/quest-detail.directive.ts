import { Directive, forwardRef, Input, Output } from '@angular/core'
import { NwDbService } from '~/nw'
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
    this.patchState({ questId: value })
  }

  @Output()
  public nwbQuestChange = this.quest$

  public constructor(db: NwDbService) {
    super(db)
  }
}
