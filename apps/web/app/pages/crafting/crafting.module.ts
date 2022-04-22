import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { CraftingRoutingModule } from './crafting-routing.module'
import { CraftingComponent } from './crafting.component'
import { CraftingTableModule } from '~/widgets/crafting-table'
import { PropertyGridModule } from '~/widgets/property-grid'
import { FormsModule } from '@angular/forms';
import { CraftingDetailComponent } from './crafting-detail.component'
import { ItemDetailModule } from '~/widgets/item-detail'

@NgModule({
  imports: [CommonModule, CraftingRoutingModule, CraftingTableModule, PropertyGridModule, FormsModule, ItemDetailModule],
  declarations: [CraftingComponent, CraftingDetailComponent],
})
export class CraftingModule {}
