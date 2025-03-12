import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { apiResource, injectRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { LootModule } from '~/widgets/loot'
import { ItemDetailSalvageInfoComponent } from '../items/ui/item-detail-salvage-info.component'

@Component({
  selector: 'nwb-season-pass-detail-page',
  templateUrl: './season-pass-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    LayoutModule,
    ItemDetailModule,
    RouterModule,
    LootModule,
    IconsModule,
    ItemDetailSalvageInfoComponent,
  ],
  host: {
    class: 'flex flex-col gap-2',
  },
})
export class SeasonPassDetailPageComponent {
  private db = injectNwData()
  protected route = inject(ActivatedRoute)
  protected id = toSignal(injectRouteParam('id'))
  protected resource = apiResource({
    request: () => this.id(),
    loader: async ({ request }) => {
      const data = await this.db.seasonPassRanksById(request)
      const freeReward = await this.db.seasonsRewardsById(data.FreeRewardId)
      const premiumReward = await this.db.seasonsRewardsById(data.PremiumRewardId)
      // const entitlementsMap = await this.db.entitlementsByIdMap()
      return [
        {
          title: 'Free Reward',
          itemId: freeReward?.DisplayItemId || freeReward?.ItemId,
          entitlementIds: freeReward?.EntitlementIds,
        },
        {
          title: 'Premium Reward',
          itemId: premiumReward?.DisplayItemId || premiumReward?.ItemId,
          entitlementIds: premiumReward?.EntitlementIds,
        },
      ].filter((it) => it.itemId)
    },
  })
  protected iconLink = svgSquareArrowUpRight
}
