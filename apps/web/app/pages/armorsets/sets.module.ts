import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { SetsRoutingModule } from './sets-routing.module'
import { SetsComponent } from './sets.component'
import { NwModule } from '~/core/nw'

@NgModule({
  imports: [CommonModule, NwModule, SetsRoutingModule],
  declarations: [SetsComponent],
  exports: [SetsComponent],
})
export class SetsModule {}
