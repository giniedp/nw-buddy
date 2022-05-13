import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { SetsRoutingModule } from './armorsets-routing.module'

import { NwModule } from '~/core/nw'
import { FormsModule } from '@angular/forms'
import { ArmorsetsComponent } from './armorsets.component'
import { SidebarModule } from '~/ui/sidebar'
import { DataTableModule } from '~/ui/data-table'
import { ItemDetailModule } from '~/widgets/item-detail'

@NgModule({
  imports: [CommonModule, NwModule, SetsRoutingModule, FormsModule, SidebarModule, DataTableModule, ItemDetailModule],
  declarations: [ArmorsetsComponent],
  exports: [ArmorsetsComponent],
})
export class ArmorsetsModule {}
