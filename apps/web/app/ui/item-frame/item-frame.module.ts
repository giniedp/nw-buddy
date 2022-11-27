import { NgModule } from '@angular/core'
import { ItemDividerComponent } from './item-divider.component'
import { ItemFrameComponent } from './item-frame.component'
import { ItemGsComponent } from './item-gs.component'
import { ItemHeaderComponent } from './item-header.component'
import { ItemIconFrameComponent } from './item-icon-frame.component'
import { ItemPerkComponent } from './item-perk.component'
import { ItemStatComponent } from './item-stat.component'

const COMPONENTS = [
  ItemFrameComponent,
  ItemDividerComponent,
  ItemHeaderComponent,
  ItemIconFrameComponent,
  ItemGsComponent,
  ItemStatComponent,
  ItemPerkComponent
]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ItemFrameModule {}
