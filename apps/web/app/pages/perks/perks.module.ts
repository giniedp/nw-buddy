import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { PerksRoutingModule } from './perks-routing.module'
import { PerksComponent } from './perks.component'
import { NwModule } from '~/core/nw'
import { PerksTableModule } from '~/widgets/perks-table'

@NgModule({
  imports: [CommonModule, NwModule, PerksRoutingModule, PerksTableModule],
  declarations: [PerksComponent],
})
export class PerksModule {}
