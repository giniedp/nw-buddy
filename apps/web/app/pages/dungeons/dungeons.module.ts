import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { DungeonsRoutingModule } from './dungeons-routing.module'
import { DungeonsComponent } from './dungeons.component'
import { ItemDetailModule } from '~/widgets/item-detail'
import { NwModule } from '~/core/nw';
import { FormsModule } from '@angular/forms';
import { DungeonDetailComponent } from './dungeon-detail.component';

@NgModule({
  imports: [CommonModule, NwModule, DungeonsRoutingModule, ItemDetailModule, FormsModule],
  declarations: [DungeonsComponent, DungeonDetailComponent],
})
export class DungeonsModule {}
