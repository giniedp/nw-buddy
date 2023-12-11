import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { map, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { mapProp, observeRouteParam, selectSignal } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-season-pass-detail-page',
  templateUrl: './season-pass-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule, ItemDetailModule, RouterModule, LootModule, IconsModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class SeasonPassDetailPageComponent {
  private db = inject(NwDbService)
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
    },
    map(({ data, freeReward, premiumReward }) => {
      return [
        {
          title: 'Free Reward',
          itemId: freeReward?.DisplayItemId || freeReward?.ItemId,
        },
        {
          title: 'Premium Reward',
          itemId: premiumReward?.DisplayItemId || premiumReward?.ItemId,
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
