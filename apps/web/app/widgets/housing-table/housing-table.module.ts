import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HousingTableComponent } from './housing-table.component'
import { AgGridModule } from '~/ui/ag-grid'
import { NwModule } from '~/core/nw'

@NgModule({
  declarations: [HousingTableComponent],
  imports: [CommonModule, AgGridModule, NwModule],
  exports: [HousingTableComponent],
})
export class HousingTableModule {}
