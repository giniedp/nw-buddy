import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { BrowserRoutingModule } from './browser-routing.module'
import { BrowserComponent } from './browser.component'
import { ItemsTableModule } from '~/widgets/items-table/items-table.module'
import { ItemDetailModule } from '~/widgets/item-detail/item-detail.module'

@NgModule({
  imports: [CommonModule, BrowserRoutingModule, ItemsTableModule, ItemDetailModule],
  declarations: [BrowserComponent],
})
export class BrowserModule {}
