import { NgModule } from '@angular/core'
import { AgGridDirective } from './ag-grid.directive'

@NgModule({
  imports: [AgGridDirective],
  exports: [AgGridDirective],
})
export class AgGridModule {}
