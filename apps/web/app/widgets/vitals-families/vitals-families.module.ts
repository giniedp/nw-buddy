import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { VitalsFamiliesListComponent } from './vitals-families-list.component'
import { NwModule } from '~/nw';
import { VitalDetailComponent } from './vital-detail.component'
import { VitalsDungeonBossesListComponent } from './vitals-dungeon-bosses.component';

@NgModule({
  imports: [VitalsDungeonBossesListComponent, VitalsFamiliesListComponent, VitalDetailComponent],
  exports: [VitalsDungeonBossesListComponent, VitalsFamiliesListComponent, VitalDetailComponent],
})
export class VitalsFamiliesModule {}
