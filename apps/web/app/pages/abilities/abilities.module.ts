import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { AbilitiesRoutingModule } from './abilities-routing.module'
import { AbilitiesComponent } from './abilities.component'
import { AbilitiesTableModule } from '~/widgets/abilities-table'

@NgModule({
  declarations: [AbilitiesComponent],
  imports: [CommonModule, AbilitiesRoutingModule, AbilitiesTableModule],
})
export class AbilitiesModule {}
