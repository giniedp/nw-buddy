import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { StatusEffectsTableComponent } from './status-effects-table.component'
import { NwModule } from '~/core/nw'
import { AgGridModule } from '~/ui/ag-grid'

@NgModule({
  imports: [CommonModule, NwModule, AgGridModule],
  declarations: [StatusEffectsTableComponent],
  exports: [StatusEffectsTableComponent],
})
export class StatusEffectsTableModule {}
