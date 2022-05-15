import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { VitalsRoutingModule } from './vitals-routing.module'
import { VitalsComponent } from './vitals.component'
import { DataTableModule } from '~/ui/data-table'
import { SidebarModule } from '~/ui/sidebar';
import { VitalComponent } from './vital.component'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'

@NgModule({
  declarations: [VitalsComponent, VitalComponent],
  imports: [CommonModule, VitalsRoutingModule, DataTableModule, SidebarModule, VitalsFamiliesModule],
})
export class VitalsModule {}
