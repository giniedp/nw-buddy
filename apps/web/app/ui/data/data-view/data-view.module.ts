import { NgModule } from '@angular/core'
import { DataViewCategoryMenuComponent } from './data-view-category-menu.component'
import { DataViewToggleComponent } from './data-view-toggle.component'
import { DataViewOptionsMenuComponent } from './data-view-options-menu.component'
import { DataViewPinComponent } from './data-view-pin.component'

const COMPONENTS = [
  DataViewCategoryMenuComponent,
  DataViewToggleComponent,
  DataViewOptionsMenuComponent,
  DataViewPinComponent,
]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class DataViewModule {}
