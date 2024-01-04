import { NgModule } from '@angular/core'
import { ZoneDetailComponent } from './zone-detail.component'
import { ZoneDetailMapComponent } from './zone-detail-map.component'
import { ZoneDetailDirective } from './zone-detail.directive'

const components = [ZoneDetailComponent, ZoneDetailDirective, ZoneDetailMapComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class ZoneDetailModule  {
  //
}
