import { Directive, effect, inject, input, untracked } from '@angular/core'
import { QuestDetailStore } from './quest-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbQuestDetail]',
  exportAs: 'questDetail',
  providers: [QuestDetailStore],
})
export class QuestDetailDirective {
  public store = inject(QuestDetailStore)

  public questId = input<string>(null, {
    alias: 'nwbQuestDetail',
  })

  #fxLoad = effect(() => {
    const questId = this.questId()
    untracked(() => this.store.load(questId))
  })
}
