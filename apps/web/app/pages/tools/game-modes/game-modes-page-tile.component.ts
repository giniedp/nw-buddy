import { Component, input } from '@angular/core'
import { NwModule } from '../../../nw'
import { LayoutModule } from '../../../ui/layout'
import type { CurrentMutation } from './game-modes-page.component'
import { MutaCurseTileComponent } from './muta-curse-tile.component'
import { MutaElementTileComponent } from './muta-element-tile.component'
import { MutaPromotionTileComponent } from './muta-promotion-tile.component'

@Component({
  selector: 'nwb-game-modes-page-tile',
  templateUrl: './game-modes-page-tile.component.html',
  styleUrl: './game-modes-page-tile.component.css',
  imports: [MutaElementTileComponent, MutaCurseTileComponent, MutaPromotionTileComponent, NwModule, LayoutModule],
  host: {
    class: 'grid'
  }
})
export class GameModePageTileComponent {
  public mapName = input<string | string[]>()
  public modeName = input<string | string[]>()
  public description = input<string>()
  public image = input<string>()
  public icon = input<string>()
  public mutation = input<CurrentMutation>()
}
