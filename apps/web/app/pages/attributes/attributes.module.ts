import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { AttributesRoutingModule } from './attributes-routing.module'
import { AttributesComponent } from './attributes.component'
import { NwModule } from '~/core/nw'
import { AttributesTableModule } from '~/widgets/attributes-table'

@NgModule({
  declarations: [AttributesComponent],
  imports: [CommonModule, AttributesRoutingModule, NwModule, AttributesTableModule],
})
export class AttributesModule {}
