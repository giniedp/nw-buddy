import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CraftingTableComponent } from './crafting-table.component'
import { AgGridModule } from '~/ui/ag-grid'

@NgModule({
  imports: [CommonModule, AgGridModule],
  declarations: [CraftingTableComponent],
  exports: [CraftingTableComponent],
})
export class CraftingTableModule {}
