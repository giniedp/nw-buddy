import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { DungeonsRoutingModule } from './dungeons-routing.module'
import { DungeonsComponent } from './dungeons.component'
import { ItemDetailModule } from '~/widgets/item-detail'
import { NwModule } from '~/nw'
import { FormsModule } from '@angular/forms'
import { DungeonDetailComponent } from './dungeon-detail.component'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'
import { ScreenModule } from '~/ui/screen'

@NgModule({
  imports: [
    CommonModule,
    NwModule,
    DungeonsRoutingModule,
    ItemDetailModule,
    FormsModule,
    VitalsFamiliesModule,
    ScreenModule,
  ],
  declarations: [DungeonsComponent, DungeonDetailComponent],
})
export class DungeonsModule {}
