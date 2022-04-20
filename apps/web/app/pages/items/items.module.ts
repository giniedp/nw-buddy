import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { ItemsRoutingModule } from './items-routing.module'
import { ItemsComponent } from './items.component'
import { ItemsTableModule } from '~/widgets/items-table'
import { ItemDetailModule } from '~/widgets/item-detail';
import { ItemComponent } from './item.component'
import { FormsModule } from '@angular/forms'

@NgModule({
  imports: [CommonModule, FormsModule, ItemsRoutingModule, ItemsTableModule, ItemDetailModule],
  declarations: [ItemsComponent, ItemComponent],
})
export class ItemsModule {}
