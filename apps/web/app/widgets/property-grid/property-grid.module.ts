import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PropertyGridComponent } from './property-grid.component'

@NgModule({
  imports: [CommonModule],
  declarations: [PropertyGridComponent],

  exports: [PropertyGridComponent],
})
export class PropertyGridModule {}
