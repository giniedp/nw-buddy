import { CommonModule } from '@angular/common'
import { Component, effect, inject, input, untracked } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { injectQueryParam, selectSignal } from '~/utils'
import { GameEventDetailRewardsComponent } from '../game-event-detail/game-event-detail-rewards.component'
import { QuestDetailConversationListComponent } from './quest-detail-conversation-list.component'
import { QuestDetailDescriptionComponent } from './quest-detail-description.component'
import { QuestDetailDestinationComponent } from './quest-detail-destination.component'
import { QuestDetailFollowUpComponent } from './quest-detail-follow-up.component'
import { QuestDetailStore } from './quest-detail.store'
import { QuestTaskDetailComponent } from './quest-task-detail.component'
import { QuestTreeComponent } from './quest-tree.component'
import { RequiredAchievementComponent } from './required-achievement.component'

export type QuestDetailTabId = 'details' | 'npcs' | 'tree'
export interface QuestDetailTab {
  id: QuestDetailTabId
  label: string
}

@Component({
  selector: 'nwb-quest-detail',
  templateUrl: './quest-detail.component.html',
  exportAs: 'questDetail',
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    ItemFrameModule,
    QuestDetailFollowUpComponent,
    GameEventDetailRewardsComponent,
    QuestDetailConversationListComponent,
    QuestDetailDestinationComponent,
    QuestTaskDetailComponent,
    QuestTreeComponent,
    QuestDetailDescriptionComponent,
    RequiredAchievementComponent,
  ],
  providers: [QuestDetailStore],
  host: {
    class: 'block bg-black rounded-md overflow-clip font-nimbus',
  },
})
export class QuestDetailComponent {
  protected store = inject(QuestDetailStore)

  public questId = input<string>(null)
  public questChange = outputFromObservable(toObservable(this.store.quest))

  #fxLoad = effect(() => {
    const questId = this.questId()
    untracked(() => this.store.load(questId))
  })
  protected defaultIcon = NW_FALLBACK_ICON

  protected tab = selectSignal(injectQueryParam('tab'), (it) => it as QuestDetailTabId)
  protected tabs: QuestDetailTab[] = [
    {
      id: null,
      label: 'Details',
    },
    {
      id: 'npcs',
      label: 'NPCs',
    },
    // {
    //   id: 'tree',
    //   label: 'Quest Tree',
    // }
  ]
}
