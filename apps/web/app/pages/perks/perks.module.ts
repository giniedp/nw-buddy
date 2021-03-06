import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { PerksRoutingModule } from './perks-routing.module'
import { PerksComponent } from './perks.component'
import { NwModule } from '~/core/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch';
import { PerksTableComponent } from './perks-table.component';
import { AttributesTableModule } from '~/widgets/attributes-table'
import { FormsModule } from '@angular/forms'

@NgModule({
  imports: [CommonModule, NwModule, PerksRoutingModule, DataTableModule, QuicksearchModule, AttributesTableModule, FormsModule],
  declarations: [PerksComponent, PerksTableComponent],
})
export class PerksModule {}
