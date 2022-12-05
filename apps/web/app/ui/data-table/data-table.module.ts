import { ModuleWithProviders, NgModule } from '@angular/core'
import { CategoryChildRouteParamDirective, CategoryRouteParamDirective } from './data-table-header-router.directive'
import { DataTableCategoriesComponent } from './data-table-header.component'
import { DataTableCategoriesDirective } from './data-table-categories.directive'
import { DataTablePanelButtonComponent } from './data-table-panel-button.component'
import { DataTablePanelComponent } from './data-table-panel.component'
import { DataTablePickerDialog } from './data-table-picker-dialog.component'
import { DataTablePicker } from './data-table-picker.component'
import { DataTableRouterDirective } from './data-table-router.directive'
import { DataTableComponent } from './data-table.component'
import { FilterRouteParamDirective } from './data-table-filter.directive'

const COMPONENTS = [
  DataTablePicker,
  DataTablePickerDialog,
  DataTableComponent,
  DataTableRouterDirective,
  DataTableCategoriesComponent,
  DataTablePanelComponent,
  DataTablePanelButtonComponent,
  CategoryChildRouteParamDirective,
  CategoryRouteParamDirective,
  DataTableCategoriesDirective,
  FilterRouteParamDirective,
]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class DataTableModule {}
