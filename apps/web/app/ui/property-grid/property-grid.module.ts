import { NgModule } from '@angular/core'
import { PropertyGridCellDirective } from './property-grid-cell.directive'
import { PropertyGridComponent } from './property-grid.component'

@NgModule({
  imports: [PropertyGridComponent, PropertyGridCellDirective],
  exports: [PropertyGridComponent, PropertyGridCellDirective],
})
export class PropertyGridModule {}
