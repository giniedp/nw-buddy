import { NgModule } from '@angular/core'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemCardComponent } from './item-card.component'
import { ItemDetailAttributionComponent } from './item-detail-attribution.component'
import { ItemDetailDescriptionHeargemComponent } from './item-detail-description-heargem.component'
import { ItemDetailDescriptionComponent } from './item-detail-description.component'
import { ItemDetailGsDamage } from './item-detail-gs-damage.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { ItemDetailInfoComponent } from './item-detail-info.component'
import { ItemDetailPerkTasksComponent } from './item-detail-perk-tasks.component'
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemDetailSalvageRewardsComponent } from './item-detail-salvage-rewards.component'
import { ItemDetailSetItemsComponent } from './item-detail-set-items.component'
import { ItemDetailSetPerksComponent } from './item-detail-set-perks.component'
import { ItemDetailStatsComponent } from './item-detail-stats.component'
import { ItemDetailTransformsComponent } from './item-detail-transforms.component'
import { ItemDetailComponent } from './item-detail.component'
import { ItemDetailDirective } from './item-detail.directive'

const COMPONENTS = [
  ItemCardComponent,
  ItemDetailAttributionComponent,
  ItemDetailComponent,
  ItemDetailDescriptionComponent,
  ItemDetailDescriptionHeargemComponent,
  ItemDetailDirective,
  ItemDetailGsDamage,
  ItemDetailHeaderComponent,
  ItemDetailInfoComponent,
  ItemDetailPerksComponent,
  ItemDetailPerkTasksComponent,
  ItemDetailSalvageRewardsComponent,
  ItemDetailSetItemsComponent,
  ItemDetailStatsComponent,
  ItemDetailTransformsComponent,
  ItemDetailSetPerksComponent,
  ItemFrameModule,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ItemDetailModule {}
