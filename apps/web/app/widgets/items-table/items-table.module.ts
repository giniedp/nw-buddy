import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/ui/ag-grid'
import { ItemsTableComponent } from './items-table.component'

@NgModule({
  imports: [CommonModule, AgGridModule],
  declarations: [ItemsTableComponent],
  exports: [ItemsTableComponent],
})
export class ItemsTableModule {}
