import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DataTableComponent } from './data-table.component'
import { NwModule } from '~/core/nw'
import { AgGridModule } from '../ag-grid'
import { DataTableRouterDirective } from './data-table-router.directive'

@NgModule({
  imports: [CommonModule, NwModule, AgGridModule],
  declarations: [DataTableComponent, DataTableRouterDirective],
  exports: [DataTableComponent, DataTableRouterDirective],
})
export class DataTableModule {}
