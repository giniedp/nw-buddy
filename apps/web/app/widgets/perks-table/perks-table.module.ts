import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PerksTableComponent } from './perks-table.component'
import { NwModule } from '~/core/nw'
import { AgGridModule } from '~/ui/ag-grid'

@NgModule({
  imports: [CommonModule, NwModule, AgGridModule],
  declarations: [PerksTableComponent],
  exports: [PerksTableComponent],
})
export class PerksTableModule {}
