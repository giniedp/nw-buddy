import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { apiResource, observeRouteParam } from '~/utils'
import { EntitlementDetailModule } from '~/widgets/data/entitlement-detail'
import { MetaAchievementDetailModule } from '~/widgets/data/meta-achievement-detail'
import { PlayerTitleDetailModule } from '~/widgets/data/player-title-detail'
import { LootModule } from '~/widgets/loot'

@Component({
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
    class: 'block',
  },
})
export class PlayerTitleDetailPageComponent {
  private db = injectNwData()
  protected route = inject(ActivatedRoute)
  protected id = toSignal(observeRouteParam(this.route, 'id'))

  protected data = apiResource({
    request: () => this.id(),
    loader: async ({ request }) => {
      const item = await this.db.playerTitlesById(request)
      const [achievement, metaAchievement] = await Promise.all([
        this.db.achievementsById(item.AchievementId),
        this.db.metaAchievementsById(item.MetaAchievementId),
      ])
      return { item, achievement, metaAchievement }
    },
  })
}
