import { NgModule } from '@angular/core'
import { EntriesPipe } from './entries.pipe'
import { PropertyGridComponent } from './property-grid.component'

@NgModule({
  imports: [PropertyGridComponent, EntriesPipe],
  exports: [PropertyGridComponent, EntriesPipe],
})
export class PropertyGridModule {}
