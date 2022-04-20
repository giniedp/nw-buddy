import { NgModule, OnDestroy, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'

import { XpRoutingModule } from './xp-routing.module'
import { XpComponent } from './xp.component'
import { NwModule } from '~/core/nw'
import { ChartModule } from '~/ui/chart'

@NgModule({
  imports: [CommonModule, XpRoutingModule, NwModule, ChartModule],
  declarations: [XpComponent],
})
export class XpModule {

}
