import { NgModule } from '@angular/core'
import { VitalDamageTableComponent } from './vital-damage-table.component'
import { VitalDetailComponent } from './vital-detail.component'
import { VitalFamilyDetailComponent } from './vital-family-detail.component'
import { VitalsDungeonBossesListComponent } from './vitals-dungeon-bosses.component'
import { VitalsFamiliesListComponent } from './vitals-families-list.component'

const COMPONENTS = [
  VitalsDungeonBossesListComponent,
  VitalsFamiliesListComponent,
  VitalDetailComponent,
  VitalFamilyDetailComponent,
  VitalDamageTableComponent,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class VitalsDetailModule {}
