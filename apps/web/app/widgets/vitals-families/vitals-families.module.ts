import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { VitalsFamiliesListComponent } from './vitals-families-list.component'
import { VitalsFamilyInfoComponent } from './vitals-family-info.component'
import { NwModule } from '~/core/nw';
import { VitalDetailComponent } from './vital-detail.component'

@NgModule({
  imports: [CommonModule, NwModule],
  declarations: [VitalsFamiliesListComponent, VitalsFamilyInfoComponent, VitalDetailComponent],
  exports: [VitalsFamiliesListComponent, VitalsFamilyInfoComponent, VitalDetailComponent],
})
export class VitalsFamiliesModule {}
