import { NgModule } from '@angular/core'
import { AgGridComponent } from './ag-grid.component'
import { AgGridDirective } from './ag-grid.directive'

@NgModule({
  imports: [AgGridComponent, AgGridDirective],
  exports: [AgGridComponent, AgGridDirective],
})
export class AgGridModule {}
