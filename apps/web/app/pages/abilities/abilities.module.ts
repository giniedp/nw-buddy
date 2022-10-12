import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'
import { ScreenModule } from '~/ui/screen'
import { AbilitiesRoutingModule } from './abilities-routing.module'
import { AbilitiesTableComponent } from './abilities-table.component'
import { AbilitiesComponent } from './abilities.component'

@NgModule({
  declarations: [AbilitiesComponent, AbilitiesTableComponent],
  imports: [CommonModule, AbilitiesRoutingModule, DataTableModule, QuicksearchModule, ScreenModule],
})
export class AbilitiesModule {}
