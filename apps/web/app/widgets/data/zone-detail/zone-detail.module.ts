import { NgModule } from '@angular/core'
import { ZoneDetailComponent } from './zone-detail.component'
import { ZoneDetailMapComponent } from './zone-detail-map.component'

const components = [ZoneDetailComponent, ZoneDetailMapComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class ZoneDetailModule  {
  //
}
