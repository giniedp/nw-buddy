import { NgModule } from '@angular/core'
import { ItemCardComponent } from './item-card.component'
import { ItemDetailDescriptionComponent } from './item-detail-description.component'
import { ItemDetailDivider } from './item-detail-divider.component'
import { ItemDetailHeaderBackdropComponent } from './item-detail-header-backdrop.component'
import { ItemDetailHeaderContentComponent } from './item-detail-header-content.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { ItemDetailInfoComponent } from './item-detail-info.component'
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemDetailStatsComponent } from './item-detail-stats.component'
import { ItemDetailComponent } from './item-detail.component'

const COMPONENTS = [
  ItemCardComponent,
  ItemDetailComponent,
  ItemDetailDescriptionComponent,
  ItemDetailHeaderComponent,
  ItemDetailPerksComponent,
  ItemDetailStatsComponent,
  ItemDetailInfoComponent,
  ItemDetailDivider,
  ItemDetailHeaderBackdropComponent,
  ItemDetailHeaderContentComponent
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ItemDetailModule {}
