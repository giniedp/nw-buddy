import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { EntitlementDetailModule } from '~/widgets/data/entitlement-detail'
import { MetaAchievementDetailModule } from '~/widgets/data/meta-achievement-detail'
//import { PlayerTitleDetailModule } from '~/widgets/data/weapon-definitions-detail'
import { LootModule } from '~/widgets/loot'

@Component({
  selector: 'nwb-weapon-definition-detail-page',
  templateUrl: './weapon-definition-detail-page.component.html',
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
    //PlayerTitleDetailModule,
    MetaAchievementDetailModule,
  ],
  host: {
    class: 'block',
  },
})
export class WeaponDefinitionDetailPageComponent {
  // private db = inject(NwDataService)
  // protected route = inject(ActivatedRoute)
  // protected id$ = observeRouteParam(this.route, 'id')
  // protected data$ = this.db.playerTitle(this.id$)
  // protected data = toSignal(this.data$)
  // protected achievement$ = this.db.achievement(this.data$.pipe(mapProp('AchievementId')))
  // protected achievement = toSignal(this.achievement$)
  // protected metaAchievement$ = this.db.metaAchievement(this.data$.pipe(mapProp('MetaAchievementId')))
  // protected metaAchievement = toSignal(this.metaAchievement$)
}
