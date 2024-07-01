import { NgModule } from '@angular/core'
import { GatherableDetailHeaderComponent } from './gatherable-detail-header.component'
import { GatherableDetailMapComponent } from './gatherable-detail-map.component'
import { GatherableDetailComponent } from './gatherable-detail.component'
import { GatherableDetailDirective } from './gatherable-detail.directive'
import { GatherableDetailStatsComponent } from './gatherable-detail-stats.component'

const components = [
  GatherableDetailComponent,
  GatherableDetailDirective,
  GatherableDetailHeaderComponent,
  GatherableDetailMapComponent,
  GatherableDetailStatsComponent,
]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class GatherableDetailModule {
  //
}
