import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { SetsRoutingModule } from './armorsets-routing.module'

import { NwModule } from '~/nw'
import { FormsModule } from '@angular/forms'
import { ArmorsetsComponent } from './armorsets.component'
import { DataTableModule } from '~/ui/data-table'
import { ItemDetailModule } from '~/widgets/item-detail'
import { QuicksearchModule } from '~/ui/quicksearch';
import { ArmorsetsTableComponent } from './armorsets-table.component';

@NgModule({
  imports: [CommonModule, NwModule, SetsRoutingModule, FormsModule, DataTableModule, ItemDetailModule, QuicksearchModule],
  declarations: [ArmorsetsComponent, ArmorsetsTableComponent],
  exports: [ArmorsetsComponent],
})
export class ArmorsetsModule {}
