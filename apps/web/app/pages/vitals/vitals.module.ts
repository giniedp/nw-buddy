import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { VitalsRoutingModule } from './vitals-routing.module'
import { VitalsComponent } from './vitals.component'
import { DataTableModule } from '~/ui/data-table'
import { VitalComponent } from './vital.component'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'
import { QuicksearchModule } from '~/ui/quicksearch'
import { VitalsFamiliesComponent } from './vitals-families.component'
import { RouterModule } from '@angular/router'
import { VitalsTableComponent } from './vitals-table.component'
import { LootModule } from '~/widgets/loot'
import { ScreenModule } from '~/ui/screen'

@NgModule({
  declarations: [VitalsComponent, VitalComponent, VitalsFamiliesComponent, VitalsTableComponent],
  imports: [
    CommonModule,
    RouterModule,
    VitalsRoutingModule,
    DataTableModule,
    VitalsFamiliesModule,
    QuicksearchModule,
    VitalsFamiliesModule,
    LootModule,
    ScreenModule
  ],
})
export class VitalsModule {}
