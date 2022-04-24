import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { StatusEffectsModuleRoutingModule } from './status-effects-routing.module'
import { StatusEffectsComponent } from './status-effects.component'
import { PropertyGridModule } from '~/ui/property-grid'
import { DataTableModule } from '~/ui/data-table'
import { SidebarModule } from '~/ui/sidebar'

@NgModule({
  imports: [CommonModule, StatusEffectsModuleRoutingModule, PropertyGridModule, DataTableModule, SidebarModule],
  declarations: [StatusEffectsComponent],
})
export class StatusEffectsModule {}
