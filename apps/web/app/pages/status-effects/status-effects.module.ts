import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { StatusEffectsRoutingModule } from './status-effects-routing.module'
import { StatusEffectsComponent } from './status-effects.component'
import { PropertyGridModule } from '~/ui/property-grid'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'
import { StatusEffectsTableComponent } from './status-effects-table.component'
import { NwModule } from '~/nw'

@NgModule({
  imports: [CommonModule, NwModule, StatusEffectsRoutingModule, DataTableModule, QuicksearchModule],
  declarations: [StatusEffectsComponent, StatusEffectsTableComponent],
})
export class StatusEffectsModule {}
