import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AttributesTableComponent } from './attributes-table.component'
import { NwModule } from '~/core/nw'
import { ItemDetailModule } from '../item-detail'

@NgModule({
  declarations: [AttributesTableComponent],
  imports: [CommonModule, NwModule, ItemDetailModule],
  exports: [AttributesTableComponent],
})
export class AttributesTableModule {

}
