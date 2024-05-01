import { NgModule } from '@angular/core'
import { GatherableDetailComponent } from './gatherable-detail.component'
import { GatherableDetailDirective } from './gatherable-detail.directive'
import { GatherableDetailMapComponent } from './gatherable-detail-map.component'

const components = [GatherableDetailComponent, GatherableDetailDirective, GatherableDetailMapComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class GatherableDetailModule {
  //
}
