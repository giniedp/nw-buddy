import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LootTableComponent } from './loot-table.component'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'
import { LootTableEntryComponent } from './loot-table-entry.component'
import { LootTableListComponent } from './loot-table-list.component'

const COMPONENTS = [
  LootTableEntryComponent,
  LootTableListComponent,
  LootTableComponent
]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class LootModule {}
