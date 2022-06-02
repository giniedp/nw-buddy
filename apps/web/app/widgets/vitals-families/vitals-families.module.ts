import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { VitalsFamiliesListComponent } from './vitals-families-list.component'
import { NwModule } from '~/core/nw';
import { VitalDetailComponent } from './vital-detail.component'

@NgModule({
  imports: [CommonModule, NwModule],
  declarations: [VitalsFamiliesListComponent, VitalDetailComponent],
  exports: [VitalsFamiliesListComponent, VitalDetailComponent],
})
export class VitalsFamiliesModule {}
