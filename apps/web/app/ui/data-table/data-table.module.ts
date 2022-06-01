import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DataTableComponent } from './data-table.component'
import { NwModule } from '~/core/nw'
import { AgGridModule } from '../ag-grid'
import { DataTableRouterDirective } from './data-table-router.directive'
import { DataTableCategoriesComponent } from './data-table-categories.component'
import {
  CategoryChildRouteParamDirective,
  CategoryRouteParamDirective,
} from './data-table-categories-router.directive'
import { RouterModule } from '@angular/router'

@NgModule({
  imports: [CommonModule, NwModule, AgGridModule, RouterModule],
  declarations: [
    DataTableComponent,
    DataTableRouterDirective,
    DataTableCategoriesComponent,
    CategoryChildRouteParamDirective,
    CategoryRouteParamDirective,
  ],
  exports: [
    DataTableComponent,
    DataTableRouterDirective,
    DataTableCategoriesComponent,
    CategoryChildRouteParamDirective,
    CategoryRouteParamDirective,
  ],
})
export class DataTableModule {}
