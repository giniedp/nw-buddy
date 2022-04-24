import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { SetsRoutingModule } from './armorsets-routing.module'

import { NwModule } from '~/core/nw'
import { FormsModule } from '@angular/forms'
import { ArmorsetComponent } from './armorset.component'
import { ArmorsetsComponent } from './armorsets.component'
import { SidebarModule } from '~/ui/sidebar'
import { DataTableModule } from '~/ui/data-table'

@NgModule({
  imports: [CommonModule, NwModule, SetsRoutingModule, FormsModule, SidebarModule, DataTableModule],
  declarations: [ArmorsetsComponent, ArmorsetComponent],
  exports: [ArmorsetsComponent],
})
export class ArmorsetsModule {}
