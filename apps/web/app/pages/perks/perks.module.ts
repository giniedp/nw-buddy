import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { PerksRoutingModule } from './perks-routing.module'
import { PerksComponent } from './perks.component'
import { NwModule } from '~/core/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch';

@NgModule({
  imports: [CommonModule, NwModule, PerksRoutingModule, DataTableModule, QuicksearchModule],
  declarations: [PerksComponent],
})
export class PerksModule {}
