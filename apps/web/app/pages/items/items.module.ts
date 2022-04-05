import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { ItemsRoutingModule } from './items-routing.module'
import { ItemsComponent } from './items.component'
import { ItemDetailComponent } from './item-detail.component'
import { ItemsTableModule } from '~/widgets/items-table';
import { ItemDetailModule } from '~/widgets/item-detail'

@NgModule({
  imports: [CommonModule, ItemsRoutingModule, ItemsTableModule, ItemDetailModule],
  declarations: [ItemsComponent, ItemDetailComponent],
})
export class ItemsModule {}
