import { NgModule } from '@angular/core'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemCardComponent } from './item-card.component'
import { ItemDetailDescriptionComponent } from './item-detail-description.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { ItemDetailInfoComponent } from './item-detail-info.component'
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemDetailSalvageRewardsComponent } from './item-detail-salvage-rewards.component'
import { ItemDetailSetItemsComponent } from './item-detail-set-items.component'
import { ItemDetailStatsComponent } from './item-detail-stats.component'
import { ItemDetailTransformsComponent } from './item-detail-transforms.component'
import { ItemDetailComponent } from './item-detail.component'
import { ItemDetailDirective } from './item-detail.directive'

const COMPONENTS = [
  ItemCardComponent,
  ItemDetailComponent,
  ItemDetailDescriptionComponent,
  ItemDetailDirective,
  ItemDetailHeaderComponent,
  ItemDetailInfoComponent,
  ItemDetailPerksComponent,
  ItemDetailSalvageRewardsComponent,
  ItemDetailSetItemsComponent,
  ItemDetailStatsComponent,
  ItemDetailTransformsComponent,
  ItemFrameModule,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ItemDetailModule {}
