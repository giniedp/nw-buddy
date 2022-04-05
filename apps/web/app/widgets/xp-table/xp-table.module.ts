import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/core/ag-grid'


import { XpTableComponent } from './xp-table.component'

@NgModule({
  imports: [CommonModule, AgGridModule],
  declarations: [XpTableComponent],
  exports: [XpTableComponent],
})
export class XpTableModule {}
