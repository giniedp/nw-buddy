import { NgModule } from '@angular/core'
import { ZoneDetailComponent } from './zone-detail.component'
import { ZoneDetailMapComponent } from './zone-map/zone-map.component'
import { ZoneDetailDirective } from './zone-detail.directive'

const components = [ZoneDetailComponent, ZoneDetailDirective, ZoneDetailMapComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class ZoneDetailModule {
  //
}
