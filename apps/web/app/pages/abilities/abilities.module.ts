import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { AbilitiesRoutingModule } from './abilities-routing.module'
import { AbilitiesComponent } from './abilities.component'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'

@NgModule({
  declarations: [AbilitiesComponent],
  imports: [CommonModule, AbilitiesRoutingModule, DataTableModule, QuicksearchModule],
})
export class AbilitiesModule {}
