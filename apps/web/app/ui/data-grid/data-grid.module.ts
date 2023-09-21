import { NgModule } from '@angular/core'
import { DataGridCategoryMenuComponent, DataGridPanelButtonComponent } from './components'
import { DataGridComponent } from './data-grid.component'
import {
  DataGridFilterQueryParamDirective,
  DataGridQuickfilterDirective,
  DataGridSelectionRouteParamDirective,
} from './extensions'

const COMPONENTS = [
  DataGridComponent,
  DataGridCategoryMenuComponent,
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
