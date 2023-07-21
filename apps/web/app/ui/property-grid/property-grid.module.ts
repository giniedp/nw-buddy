import { NgModule } from '@angular/core'
import { EntriesPipe } from './entries.pipe'
import { PropertyGridComponent } from './property-grid.component'
import { PropertyGridValueDirective } from './property-grid-value.directive'

@NgModule({
  imports: [PropertyGridComponent, PropertyGridValueDirective, EntriesPipe],
  exports: [PropertyGridComponent, PropertyGridValueDirective, EntriesPipe],
})
export class PropertyGridModule {}
