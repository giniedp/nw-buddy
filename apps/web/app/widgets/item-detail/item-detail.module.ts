import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/ui/ag-grid'
import { NwModule } from '~/core/nw'
import { ItemDetailComponent } from './item-detail.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { CraftingCalculatorModule } from '../crafting-calculator';
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemTrackerModule } from '../item-tracker'

@NgModule({
  imports: [CommonModule, AgGridModule, NwModule, CraftingCalculatorModule, ItemTrackerModule],
  declarations: [ItemDetailComponent, ItemDetailHeaderComponent, ItemDetailPerksComponent],
  exports: [ItemDetailComponent, ItemDetailHeaderComponent],
})
export class ItemDetailModule {}
