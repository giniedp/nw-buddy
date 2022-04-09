import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/core/ag-grid'
import { NwModule } from '~/core/nw'
import { ItemDetailComponent } from './item-detail.component';
import { ItemDetailHeaderComponent } from './item-detail-header.component'

@NgModule({
  imports: [CommonModule, AgGridModule, NwModule],
  declarations: [ItemDetailComponent, ItemDetailHeaderComponent],
  exports: [ItemDetailComponent, ItemDetailHeaderComponent],
})
export class ItemDetailModule {}
