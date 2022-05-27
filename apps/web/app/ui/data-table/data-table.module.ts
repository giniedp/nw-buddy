import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DataTableComponent } from './data-table.component'
import { NwModule } from '~/core/nw'
import { AgGridModule } from '../ag-grid'
import { DataTableRouterDirective } from './data-table-router.directive';
import { DataTableCategoriesComponent } from './data-table-categories.component'
import { DataTableCategoriesRouterDirective } from './data-table-categories-router.directive'

@NgModule({
  imports: [CommonModule, NwModule, AgGridModule],
  declarations: [DataTableComponent, DataTableRouterDirective, DataTableCategoriesComponent, DataTableCategoriesRouterDirective],
  exports: [DataTableComponent, DataTableRouterDirective, DataTableCategoriesComponent, DataTableCategoriesRouterDirective],
})
export class DataTableModule {}
