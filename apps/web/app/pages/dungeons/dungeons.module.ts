import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { DungeonsRoutingModule } from './dungeons-routing.module'
import { DungeonsComponent } from './dungeons.component'
import { ItemDetailModule } from '~/widgets/item-detail'

@NgModule({
  imports: [CommonModule, DungeonsRoutingModule, ItemDetailModule],
  declarations: [DungeonsComponent],
})
export class DungeonsModule {}
