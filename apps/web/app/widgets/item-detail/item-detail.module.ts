import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/ui/ag-grid'
import { NwModule } from '~/core/nw'
import { ItemDetailComponent } from './item-detail.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { CraftingCalculatorModule } from '../crafting-calculator'

@NgModule({
  imports: [CommonModule, AgGridModule, NwModule, CraftingCalculatorModule],
  declarations: [ItemDetailComponent, ItemDetailHeaderComponent],
  exports: [ItemDetailComponent, ItemDetailHeaderComponent],
})
export class ItemDetailModule {}
