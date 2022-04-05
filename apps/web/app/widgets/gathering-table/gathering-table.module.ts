import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/core/ag-grid'

import { GatheringTableComponent } from './gathering-table.component'

@NgModule({
  imports: [CommonModule, AgGridModule],
  declarations: [GatheringTableComponent],
  exports: [GatheringTableComponent],
})
export class GatheringTableModule {}
