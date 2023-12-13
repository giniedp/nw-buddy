import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TemplateRef, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { mapProp, observeRouteParam, selectSignal } from '~/utils'
import { EntitlementDetailModule } from '~/widgets/data/entitlement-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { MetaAchievementDetailModule } from '~/widgets/data/meta-achievement-detail'
import { PlayerTitleDetailModule } from '~/widgets/data/player-title-detail'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-player-title-detail-page',
  templateUrl: './player-title-detail-page.component.html',
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
    PlayerTitleDetailModule,
    MetaAchievementDetailModule,
  ],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class PlayerTitleDetailPageComponent {
  private db = inject(NwDbService)
  protected route = inject(ActivatedRoute)
  protected id$ = observeRouteParam(this.route, 'id')

  protected data$ = this.db.playerTitle(this.id$)
  protected data = toSignal(this.data$)

  protected achievement$ = this.db.achievement(this.data$.pipe(mapProp('AchievementId')))
  protected achievement = toSignal(this.achievement$)

  protected metaAchievement$ = this.db.metaAchievement(this.data$.pipe(mapProp('MetaAchievementId')))
  protected metaAchievement = toSignal(this.metaAchievement$)
}
