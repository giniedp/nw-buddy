import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { PveDamageRoutingModule } from './pve-damage-routing.module'
import { PveDamageComponent } from './pve-damage.component'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'

@NgModule({
  declarations: [PveDamageComponent],
  imports: [CommonModule, PveDamageRoutingModule, VitalsFamiliesModule],
})
export class PveDamageModule {}
