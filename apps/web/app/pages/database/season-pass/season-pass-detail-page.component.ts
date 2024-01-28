import { animate, state, style, transition, trigger } from '@angular/animations'
import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
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
    class: 'flex-none flex flex-col',
  },
})
export class SeasonPassDetailPageComponent {
  private db = inject(NwDataService)
  private dialog = inject(Dialog)
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
    (({ data, freeReward, premiumReward, entitlementsMap }) => {
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
    }),
  )

  protected openRepairRecipe(tpl: TemplateRef<any>) {
    this.dialog.open(tpl, {
      panelClass: ['w-full', 'h-full', 'max-w-4xl', 'layout-pad', 'shadow'],
    })
  }

  protected closeDialog() {
    this.dialog.closeAll()
  }
}
