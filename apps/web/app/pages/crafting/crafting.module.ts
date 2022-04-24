import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { CraftingRoutingModule } from './crafting-routing.module'
import { CraftingComponent } from './crafting.component'
import { PropertyGridModule } from '~/ui/property-grid'
import { FormsModule } from '@angular/forms'
import { CraftingDetailComponent } from './crafting-detail.component'
import { ItemDetailModule } from '~/widgets/item-detail'
import { DataTableModule } from '~/ui/data-table'
import { SidebarModule } from '~/ui/sidebar'

@NgModule({
  imports: [
    CommonModule,
    CraftingRoutingModule,
    PropertyGridModule,
    FormsModule,
    ItemDetailModule,
    DataTableModule,
    SidebarModule,
  ],
  declarations: [CraftingComponent, CraftingDetailComponent],
})
export class CraftingModule {}
