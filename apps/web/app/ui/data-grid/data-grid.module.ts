import { NgModule } from '@angular/core'
import { DataGridComponent } from './data-grid.component'
import { DataGridCategoryMenuComponent, DataGridPanelButtonComponent, DataGridQuickfilterDirective } from './components'

const COMPONENTS = [
  DataGridComponent,
  DataGridCategoryMenuComponent,
  DataGridPanelButtonComponent,
  DataGridQuickfilterDirective,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class DataGridModule {}
