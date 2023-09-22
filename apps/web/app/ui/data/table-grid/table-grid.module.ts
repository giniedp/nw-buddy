import { NgModule } from '@angular/core'
import { TableGridCategoryMenuComponent, DataGridPanelButtonComponent } from './components'
import { TableGridComponent } from './table-grid.component'
import {
  DataGridFilterQueryParamDirective,
  DataGridQuickfilterDirective,
  DataGridSelectionRouteParamDirective,
} from './extensions'

const COMPONENTS = [
  TableGridComponent,
  TableGridCategoryMenuComponent,
  DataGridPanelButtonComponent,
  DataGridQuickfilterDirective,
  DataGridSelectionRouteParamDirective,
  DataGridFilterQueryParamDirective,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class DataGridModule {}
