import { NgModule } from '@angular/core'
import { NpcDetailMapComponent } from './npc-detail-map.component'
import { NpcDetailComponent } from './npc-detail.component'

const COMPONENTS = [NpcDetailComponent, NpcDetailMapComponent]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class NpcDetailModule {}
