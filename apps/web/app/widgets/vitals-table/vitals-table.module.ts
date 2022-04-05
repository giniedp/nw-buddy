import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { VitalsTableComponent } from './vitals-table.component'
import { AgGridModule } from '~/core/ag-grid'

@NgModule({
  imports: [CommonModule, AgGridModule],
  declarations: [VitalsTableComponent],
  exports: [VitalsTableComponent],
})
export class VitalsTableModule {}
