import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AbilitiesTableComponent } from './abilities-table.component'
import { NwModule } from '~/core/nw'
import { AgGridModule } from '~/ui/ag-grid'

@NgModule({
  imports: [CommonModule, NwModule, AgGridModule],
  declarations: [AbilitiesTableComponent],
  exports: [AbilitiesTableComponent],
})
export class AbilitiesTableModule {}
