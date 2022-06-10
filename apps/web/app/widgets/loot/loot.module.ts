import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LootTableComponent } from './loot-table.component'
import { DataTableModule } from '~/ui/data-table'

@NgModule({
  declarations: [LootTableComponent],
  imports: [CommonModule, DataTableModule],
  exports: [LootTableComponent],
})
export class LootModule {}
