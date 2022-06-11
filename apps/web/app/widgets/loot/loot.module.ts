import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LootTableComponent } from './loot-table.component'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'

@NgModule({
  declarations: [LootTableComponent],
  imports: [CommonModule, DataTableModule, QuicksearchModule],
  exports: [LootTableComponent],
})
export class LootModule {}
