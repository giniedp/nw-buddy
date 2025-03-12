import { NgModule } from '@angular/core'
import { LootContextEditorComponent } from './loot-context-editor.component'
import { LootGraphComponent } from './loot-graph.component'

const COMPONENTS = [LootGraphComponent, LootContextEditorComponent]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class LootModule {}
