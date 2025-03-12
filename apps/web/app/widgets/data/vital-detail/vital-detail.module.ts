import { NgModule } from '@angular/core'
import { VitalDetailAttacksComponent } from './vital-detail-attacks.component'
import { VitalDetailBuffsComponent } from './vital-detail-buffs.component'
import { VitalDetailCardComponent } from './vital-detail-card.component'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailModelsComponent } from './vital-detail-models.component'
import { VitalDetailStatsComponent } from './vital-detail-stats.component'
import { VitalDetailComponent } from './vital-detail.component'
import { VitalDetailDirective } from './vital-detail.directive'
import { VitalDetailMapComponent } from './vital-detail-map.component'

const components = [
  VitalDetailCardComponent,
  VitalDetailComponent,
  VitalDetailDirective,
  VitalDetailHeaderComponent,
  VitalDetailAttacksComponent,
  VitalDetailBuffsComponent,
  VitalDetailModelsComponent,
  VitalDetailStatsComponent,
  VitalDetailMapComponent,
]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class VitalDetailModule {
  //
}
