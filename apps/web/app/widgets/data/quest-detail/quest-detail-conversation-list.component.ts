import { Component, inject } from '@angular/core'
import { QuestDetailConversationComponent } from './quest-detail-conversation.component'
import { QuestDetailStore } from './quest-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-quest-detail-conversation-list',
  templateUrl: './quest-detail-conversation-list.component.html',
  host: {
    class: 'flex flex-col gap-2',
    '[class.hidden]': '!conversations()?.length',
  },
  imports: [QuestDetailConversationComponent],
})
export class QuestDetailConversationListComponent {
  private store = inject(QuestDetailStore)
  protected conversations = this.store.conversations
}
