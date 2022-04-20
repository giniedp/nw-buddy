import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RecipesTableComponent } from './recipes-table.component'
import { NwModule } from '~/core/nw'
import { AgGridModule } from '~/ui/ag-grid'

@NgModule({
  imports: [CommonModule, NwModule, AgGridModule],
  declarations: [RecipesTableComponent],
  exports: [RecipesTableComponent],
})
export class AbilitiesTableModule {}
