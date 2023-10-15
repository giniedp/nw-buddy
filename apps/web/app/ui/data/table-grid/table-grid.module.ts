import { NgModule } from '@angular/core'
import {
  DataGridPanelButtonComponent,
  TableGridCategoryMenuComponent,
  TableGridExpressionButtonComponent,
  TableGridExpressionPanelComponent,
} from './components'
import {
  DataGridFilterQueryParamDirective,
  DataGridQuickfilterDirective,
  DataGridSelectionRouteParamDirective,
} from './extensions'
import { TableGridComponent } from './table-grid.component'

const COMPONENTS = [
  TableGridComponent,
  TableGridCategoryMenuComponent,
  DataGridPanelButtonComponent,
  DataGridQuickfilterDirective,
  DataGridSelectionRouteParamDirective,
  DataGridFilterQueryParamDirective,
  TableGridExpressionPanelComponent,
  TableGridExpressionButtonComponent,
]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class DataGridModule {}
