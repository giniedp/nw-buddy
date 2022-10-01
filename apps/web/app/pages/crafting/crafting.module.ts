import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'

import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { PropertyGridModule } from '~/ui/property-grid'
import { QuicksearchModule } from '~/ui/quicksearch'
import { CraftingCalculatorModule } from '~/widgets/crafting-calculator'
import { ItemDetailModule } from '~/widgets/item-detail'
import { CraftingDetailComponent } from './crafting-detail.component'
import { CraftingRoutingModule } from './crafting-routing.module'
import { CraftingRunesComponent } from './crafting-runes.component'
import { CraftingTableComponent } from './crafting-table.component'
import { CraftingTrophiesComponent } from './crafting-trophies.component'
import { CraftingComponent } from './crafting.component'

@NgModule({
  imports: [
    CommonModule,
    CraftingRoutingModule,
    PropertyGridModule,
    FormsModule,
    ItemDetailModule,
    DataTableModule,
    QuicksearchModule,
    CraftingCalculatorModule,
    NwModule
  ],
  declarations: [CraftingComponent, CraftingDetailComponent, CraftingTableComponent, CraftingRunesComponent, CraftingTrophiesComponent],
})
export class CraftingModule {}
