import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/core/ag-grid'


import { GsTableComponent } from './gs-table.component'

@NgModule({
  imports: [CommonModule, AgGridModule],
  declarations: [GsTableComponent],
  exports: [GsTableComponent],
})
export class GsTableModule {}
