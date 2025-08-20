import { Component, computed, HostBinding, inject } from '@angular/core'
import { injectNwData } from '~/data'
import { apiResource } from '~/utils'
import { GameEventDetailRewardsComponent } from '../game-event-detail/game-event-detail-rewards.component'
import { selectGameEventItemReward, selectGameEventRewards } from '../game-event-detail/selectors'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-salvage-rewards',
  template: `
    @if (rewards()?.length) {
      <h3 class="font-bold mb-1">Salvage Rewards</h3>
      <nwb-game-event-detail-rewards [rewards]="rewards()" />
    }
  `,
  imports: [GameEventDetailRewardsComponent],
  host: {
    class: 'block',
  },
})
export class ItemDetailSalvageRewardsComponent {
  private db = injectNwData()
  private store = inject(ItemDetailStore)
  protected resource = apiResource({
    request: () => this.store.record(),
    loader: async ({ request }) => {
      const eventId = request?.SalvageGameEventID
      const event = await this.db.gameEventsById(eventId)
      const itemReward = selectGameEventItemReward(event)
      const itemId = itemReward?.housingItemId || itemReward?.itemId
      const item = await this.db.itemOrHousingItem(itemId)
      const rewards = selectGameEventRewards(event, item)
      return {
        event,
        item,
        rewards,
      }
    },
  })
  protected rewards = computed(() => this.resource.value()?.rewards)

  protected isHidden = computed(() => {
    return !this.rewards()?.length
  })
}
