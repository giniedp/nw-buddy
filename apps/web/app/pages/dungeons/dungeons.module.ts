import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { DungeonsRoutingModule } from './dungeons-routing.module'
import { DungeonsComponent } from './dungeons.component'
import { ItemDetailModule } from '~/widgets/item-detail'
import { NwModule } from '~/core/nw';
import { FormsModule } from '@angular/forms';
import { DungeonDetailComponent } from './dungeon-detail.component';
import { DungeonMutationComponent } from './dungeon-mutation.component';
import { DungeonLootComponent } from './dungeon-loot.component'

@NgModule({
  imports: [CommonModule, NwModule, DungeonsRoutingModule, ItemDetailModule, FormsModule],
  declarations: [DungeonsComponent, DungeonDetailComponent, DungeonMutationComponent, DungeonLootComponent],
})
export class DungeonsModule {}
