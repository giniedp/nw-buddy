import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { VitalsRoutingModule } from './vitals-routing.module'
import { VitalsComponent } from './vitals.component'
import { DataTableModule } from '~/ui/data-table'
import { VitalComponent } from './vital.component'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'
import { QuicksearchModule } from '~/ui/quicksearch'

@NgModule({
  declarations: [VitalsComponent, VitalComponent],
  imports: [CommonModule, VitalsRoutingModule, DataTableModule, VitalsFamiliesModule, QuicksearchModule],
})
export class VitalsModule {}
