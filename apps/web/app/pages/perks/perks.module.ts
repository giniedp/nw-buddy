import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { PerksRoutingModule } from './perks-routing.module'
import { PerksComponent } from './perks.component'
import { NwModule } from '~/core/nw'
import { DataTableModule } from '~/ui/data-table'
import { SidebarModule } from '~/ui/sidebar'

@NgModule({
  imports: [CommonModule, NwModule, PerksRoutingModule, DataTableModule, SidebarModule],
  declarations: [PerksComponent],
})
export class PerksModule {}
