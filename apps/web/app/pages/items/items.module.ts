import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { ItemsRoutingModule } from './items-routing.module'
import { ItemsComponent } from './items.component'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ItemComponent } from './item.component'
import { FormsModule } from '@angular/forms'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'
import { ItemsTableComponent } from './items-table.component'
import { ScreenModule } from '~/ui/screen'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ItemsRoutingModule,
    DataTableModule,
    ItemDetailModule,
    QuicksearchModule,
    ScreenModule,
  ],
  declarations: [ItemsComponent, ItemComponent, ItemsTableComponent],
})
export class ItemsModule {}
