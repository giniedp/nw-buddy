import { NgModule } from '@angular/core'
import { ItemDividerComponent } from './item-divider.component'
import { ItemFrameComponent } from './item-frame.component'
import { ItemGsComponent } from './item-gs.component'
import { ItemHeaderContentComponent } from './item-header-content.component'
import { ItemHeaderComponent } from './item-header.component'
import { ItemIconFrameComponent } from './item-icon-frame.component'
import { ItemPerkComponent } from './item-perk.component'
import { ItemSlotComponent } from './item-slot.component'
import { ItemStatComponent } from './item-stat.component'

const COMPONENTS = [
  ItemFrameComponent,
  ItemDividerComponent,
  ItemHeaderComponent,
  ItemHeaderContentComponent,
  ItemIconFrameComponent,
  ItemGsComponent,
  ItemStatComponent,
  ItemPerkComponent,
  ItemSlotComponent,
]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ItemFrameModule {}
