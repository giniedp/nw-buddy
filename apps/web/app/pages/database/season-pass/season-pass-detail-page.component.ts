import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { mapProp, observeRouteParam, selectSignal } from '~/utils'
import { EntitlementDetailModule } from '~/widgets/data/entitlement-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
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
    EntitlementDetailModule,
  ],
  host: {
    class: 'flex flex-col gap-2',
  },
})
export class SeasonPassDetailPageComponent {
  private db = inject(NwDataService)
  protected route = inject(ActivatedRoute)
  protected id$ = observeRouteParam(this.route, 'id')
  protected data$ = this.db.seasonPassRow(this.id$)
  protected freeReward$ = this.db.seasonPassReward(this.data$.pipe(mapProp('FreeRewardId')))
  protected premiumReward$ = this.db.seasonPassReward(this.data$.pipe(mapProp('PremiumRewardId')))
  protected iconLink = svgSquareArrowUpRight

  protected itemRewards = selectSignal(
    {
      data: this.data$,
      freeReward: this.freeReward$,
      premiumReward: this.premiumReward$,
      entitlementsMap: this.db.entitlementsMap,
    },
    ({ data, freeReward, premiumReward, entitlementsMap }) => {
      if (!data || !entitlementsMap) {
        return []
      }
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
  )
}
