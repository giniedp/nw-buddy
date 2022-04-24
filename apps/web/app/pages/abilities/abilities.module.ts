import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { AbilitiesRoutingModule } from './abilities-routing.module'
import { AbilitiesComponent } from './abilities.component'
import { DataTableModule } from '~/ui/data-table'
import { FormsModule } from '@angular/forms'
import { SidebarModule } from '~/ui/sidebar'

@NgModule({
  declarations: [AbilitiesComponent],
  imports: [CommonModule, AbilitiesRoutingModule, DataTableModule, SidebarModule],
})
export class AbilitiesModule {}
