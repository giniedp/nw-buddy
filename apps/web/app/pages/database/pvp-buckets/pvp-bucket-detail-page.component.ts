import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { apiResource, injectRouteParam } from '~/utils'
import { EntitlementDetailModule } from '~/widgets/data/entitlement-detail'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { MetaAchievementDetailModule } from '~/widgets/data/meta-achievement-detail'
import { LootModule } from '~/widgets/loot'

@Component({
  selector: 'nwb-pvp-bucket-detail-page',
  templateUrl: './pvp-bucket-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    LayoutModule,
    ItemFrameModule,
    RouterModule,
    LootModule,
    IconsModule,
    EntitlementDetailModule,
    PropertyGridModule,
    MetaAchievementDetailModule,
    ItemDetailModule,
    GameEventDetailModule,
    EntitlementDetailModule,
  ],
  host: {
    class: 'block',
  },
})
export class PvpBucketDetailPageComponent {
  private db = injectNwData()
  protected id = toSignal(injectRouteParam('id'))

  private resource = apiResource({
    request: () => this.id(),
    loader: async ({ request }) => {
      const [bucket, row] = request.split('_')
      const data = await this.db.pvpStoreBucketsByBucketAndRow(bucket, Number(row))
      const reward = data?.RewardId ? await this.db.pvpRewardsById(data.RewardId) : null
      const gameEvent = reward?.GameEvent ? await this.db.gameEventsById(reward?.GameEvent) : null
      return {
        data,
        reward,
        gameEvent,
      }
    },
  })

  protected data = computed(() => this.resource.value()?.data)
  protected reward = computed(() => this.resource.value()?.reward)
  protected rewardItemId = computed(() => {
    const itemId = this.reward()?.Item || this.data()?.Item
    if (!itemId || itemId.startsWith('[')) {
      return null
    }
    return itemId
  })
  protected rewardLTID = computed(() => {
    const itemId = this.reward()?.Item
    if (!itemId || !itemId.startsWith('[LTID]')) {
      return null
    }
    return itemId.replace('[LTID]', '')
  })
  protected gameEvent = computed(() => this.resource.value()?.gameEvent)
  protected rewardEntitlement = computed(() => this.reward()?.Entitlement)
}
