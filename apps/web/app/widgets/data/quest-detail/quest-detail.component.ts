import { CommonModule } from '@angular/common'
import { Component, inject, Input, Output, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { patchState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { GameEventDetailRewardsComponent } from '../game-event-detail/game-event-detail-rewards.component'
import { GameEventDetailDirective } from '../game-event-detail/game-event-detail.directive'
import { QuestDetailConversationListComponent } from './quest-detail-conversation-list.component'
import { QuestDetailDescriptionComponent } from './quest-detail-description.component'
import { QuestDetailFollowUpComponent } from './quest-detail-follow-up.component'
import { QuestDetailStore } from './quest-detail.store'
import { QuestTaskDetailComponent } from './quest-task-detail.component'
import { QuestTreeComponent } from './quest-tree.component'
import { QuestDetailDestinationComponent } from './quest-detail-destination.component'
import { injectQueryParam, selectSignal } from '~/utils'

export type QuestDetailTabId = 'details' | 'npcs' | 'tree'
export interface QuestDetailTab {
  id: QuestDetailTabId
  label: string
}

@Component({
  standalone: true,
  selector: 'nwb-quest-detail',
  templateUrl: './quest-detail.component.html',
  exportAs: 'questDetail',
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    ItemFrameModule,
    QuestDetailFollowUpComponent,
    GameEventDetailDirective,
    GameEventDetailRewardsComponent,
    QuestDetailConversationListComponent,
    QuestDetailDestinationComponent,
    QuestTaskDetailComponent,
    QuestTreeComponent,
    QuestDetailDescriptionComponent,
  ],
  providers: [QuestDetailStore],
  host: {
    class: 'block bg-black rounded-md overflow-clip font-nimbus',
  },
})
export class QuestDetailComponent {
  protected detail = inject(QuestDetailStore)

  @Input()
  public set questId(value: string) {
    patchState(this.detail, { questId: value })
  }
  public get questId() {
    return this.detail.questId()
  }

  @Output()
  public questChange = toObservable(this.detail.quest)

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
    {
      id: 'tree',
      label: 'Quest Tree',
    }
  ]

}
