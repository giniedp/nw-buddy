import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { injectRouteParam, mapProp, observeRouteParam, selectStream } from '~/utils'
import { EntitlementDetailModule } from '~/widgets/data/entitlement-detail'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { MetaAchievementDetailModule } from '~/widgets/data/meta-achievement-detail'
import { PlayerTitleDetailModule } from '~/widgets/data/player-title-detail'
import { LootModule } from '~/widgets/loot'
import { LootGraphComponent } from '~/widgets/loot/loot-graph.component'

@Component({
  standalone: true,
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
    class: 'flex-none flex flex-col',
  },
})
export class PvpBucketDetailPageComponent {
  private db = inject(NwDbService)
  protected id$ = injectRouteParam('id')

  protected data$ = selectStream({
    buckets: this.db.pvpStoreBuckets,
    id: this.id$,
  }, ({ buckets, id }) => {
    const [bucket, row] = id.split('_')
    return buckets.find((it) => it.Bucket === bucket && it.Row === Number(row))
  })
  protected rewardId$ = selectStream(this.data$, (it) => it?.RewardId)
  protected reward$ = selectStream(this.db.pvpReward(this.rewardId$))
  protected rewardItemId$ = selectStream({
    reward: this.reward$,
    data: this.data$,
  }, ({ reward, data })=> {
    const itemId = reward?.Item || data?.Item
    if (!itemId) {
      return null
    }
    if (itemId.startsWith('[')) {
      return null
    }
    return itemId
  })
  protected rewardLTID$ = selectStream(this.reward$, (it)=> {
    if (!it?.Item) {
      return null
    }
    if (!it.Item.startsWith('[LTID]')) {
      return null
    }
    return it.Item.replace('[LTID]', '')
  })
  protected rewardEntitlement$ = selectStream(this.reward$, (it) => it?.Entitlement)
  protected gameEventId$ = selectStream(this.reward$, (it)=> it?.GameEvent)
  protected gameEvent$ = selectStream(this.db.gameEvent(this.gameEventId$))

  protected data = toSignal(this.data$)
  protected reward = toSignal(this.reward$)
  protected rewardItemId = toSignal(this.rewardItemId$)
  protected rewardLTID = toSignal(this.rewardLTID$)
  protected gameEvent = toSignal(this.gameEvent$)
  protected rewardEntitlement = toSignal(this.rewardEntitlement$)
}
