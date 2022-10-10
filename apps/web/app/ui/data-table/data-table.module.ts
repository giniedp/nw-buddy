import { NgModule } from '@angular/core'
import {
  CategoryChildRouteParamDirective,
  CategoryRouteParamDirective
} from './data-table-categories-router.directive'
import { DataTableCategoriesComponent } from './data-table-categories.component'
import { DataTablePickerDialog } from './data-table-picker-dialog.component'
import { DataTablePicker } from './data-table-picker.component'
import { DataTableRouterDirective } from './data-table-router.directive'
import { DataTableComponent } from './data-table.component'

const COMPONENTS = [
  DataTablePicker,
  DataTablePickerDialog,
  DataTableComponent,
  DataTableRouterDirective,
  DataTableCategoriesComponent,
  CategoryChildRouteParamDirective,
  CategoryRouteParamDirective,
]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class DataTableModule {}
