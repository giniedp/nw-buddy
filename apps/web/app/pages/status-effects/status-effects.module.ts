import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'
import { ScreenModule } from '~/ui/screen'
import { StatusEffectsRoutingModule } from './status-effects-routing.module'
import { StatusEffectsTableComponent } from './status-effects-table.component'
import { StatusEffectsComponent } from './status-effects.component'

@NgModule({
  imports: [CommonModule, NwModule, StatusEffectsRoutingModule, DataTableModule, QuicksearchModule, ScreenModule],
  declarations: [StatusEffectsComponent, StatusEffectsTableComponent],
})
export class StatusEffectsModule {}
