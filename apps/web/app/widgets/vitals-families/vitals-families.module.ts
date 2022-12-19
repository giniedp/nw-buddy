import { NgModule } from '@angular/core'
import { VitalsFamiliesListComponent } from './vitals-families-list.component'
import { NwModule } from '~/nw'
import { VitalDetailComponent } from './vital-detail.component'
import { VitalsDungeonBossesListComponent } from './vitals-dungeon-bosses.component'
import { VitalDamageTableComponent } from './vital-damage-table.component'

const COMPONENTS = [
  VitalsDungeonBossesListComponent,
  VitalsFamiliesListComponent,
  VitalDetailComponent,
  VitalDamageTableComponent,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class VitalsFamiliesModule {}
