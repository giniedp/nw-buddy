import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/ui/ag-grid'
import { NwModule } from '~/core/nw'
import { ItemDetailComponent } from './item-detail.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { CraftingCalculatorModule } from '../crafting-calculator'
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemTrackerModule } from '../item-tracker'
import { AffixStatComponent } from './affix-stat.component'
import { ItemDetailDirective } from './item-detail.directive'
import { ItemDetailSalvageComponent } from './item-detail-salvage.component'
import { GameEventComponent } from '../game-event'
import { ItemDetailInfoComponent } from './item-detail-info.component'

const COMPONENTS = [
  ItemDetailComponent,
  ItemDetailHeaderComponent,
  ItemDetailPerksComponent,
  AffixStatComponent,
  ItemDetailDirective,
  ItemDetailSalvageComponent,
  ItemDetailInfoComponent
]
@NgModule({
  imports: [CommonModule, AgGridModule, NwModule, CraftingCalculatorModule, ItemTrackerModule, GameEventComponent],
  declarations: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ItemDetailModule {
  //
}
