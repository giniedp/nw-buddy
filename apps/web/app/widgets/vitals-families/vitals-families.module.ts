import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { VitalsFamiliesListComponent } from './vitals-families-list.component'
import { VitalsFamilyInfoComponent } from './vitals-family-info.component'
import { NwModule } from '~/core/nw'

@NgModule({
  imports: [CommonModule, NwModule],
  declarations: [VitalsFamiliesListComponent, VitalsFamilyInfoComponent],
  exports: [VitalsFamiliesListComponent, VitalsFamilyInfoComponent],
})
export class VitalsFamiliesModule {}
