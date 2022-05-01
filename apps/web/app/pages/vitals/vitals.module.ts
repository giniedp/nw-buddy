import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { VitalsRoutingModule } from './vitals-routing.module'
import { VitalsComponent } from './vitals.component'
import { DataTableModule } from '~/ui/data-table'
import { SidebarModule } from '~/ui/sidebar'

@NgModule({
  declarations: [VitalsComponent],
  imports: [CommonModule, VitalsRoutingModule, DataTableModule, SidebarModule],
})
export class VitalsModule {}
