import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridComponent } from './ag-grid.component'

@NgModule({
  imports: [CommonModule],
  declarations: [AgGridComponent],
  exports: [AgGridComponent]
})
export class AgGridModule {}
