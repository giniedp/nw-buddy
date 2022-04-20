import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { StatusEffectsModuleRoutingModule } from './status-effects-routing.module'
import { StatusEffectsComponent } from './status-effects.component'
import { StatusEffectsTableModule } from '~/widgets/status-effects-table'
import { PropertyGridModule } from '~/widgets/property-grid'


@NgModule({
  imports: [CommonModule, StatusEffectsModuleRoutingModule, StatusEffectsTableModule, PropertyGridModule],
  declarations: [StatusEffectsComponent],
})
export class StatusEffectsModule {}
