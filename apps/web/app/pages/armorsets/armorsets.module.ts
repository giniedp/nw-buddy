import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { SetsRoutingModule } from './armorsets-routing.module'
import { SetsComponent as ArmorsetsComponent } from './armorsets.component'
import { NwModule } from '~/core/nw'
import { FormsModule } from '@angular/forms'
import { ArmorsetComponent } from './armorset.component'

@NgModule({
  imports: [CommonModule, NwModule, SetsRoutingModule, FormsModule],
  declarations: [ArmorsetsComponent, ArmorsetComponent],
  exports: [ArmorsetsComponent],
})
export class ArmorsetsModule {}
