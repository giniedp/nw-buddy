import { NgModule } from '@angular/core'
import { DataViewCategoryMenuComponent } from './data-view-category-menu.component'
import { DataViewToggleComponent } from './data-view-toggle.component'

const COMPONENTS = [DataViewCategoryMenuComponent, DataViewToggleComponent]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class DataViewModule {}
