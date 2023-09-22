import { NgModule } from '@angular/core'
import { VirtualGridQuickfilterDirective, VirtualGridSelectionRouteParamDirective } from './extensions'
import { VirtualGridCellDirective } from './virtual-grid-cell.directive'
import { VirtualGridRowDirective } from './virtual-grid-row.directive'
import { VirtualGridComponent } from './virtual-grid.component'

const COMPONENTS = [
  VirtualGridComponent,
  VirtualGridCellDirective,
  VirtualGridRowDirective,
  VirtualGridQuickfilterDirective,
  VirtualGridSelectionRouteParamDirective,
]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class VirtualGridModule {}
