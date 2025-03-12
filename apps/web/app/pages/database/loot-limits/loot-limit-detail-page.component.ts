import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { injectRouteParam } from '~/utils'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { LootLimitDetailModule } from '~/widgets/data/loot-limit-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-loot-limit-detail-page',
  templateUrl: './loot-limit-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ItemDetailModule,
    ScreenshotModule,
    LayoutModule,
    LootModule,
    GameEventDetailModule,
    LootLimitDetailModule,
  ],
  host: {
    class: 'block',
  },
})
export class LootLimitDetailPageComponent {
  protected limitId = toSignal(injectRouteParam('id'))
}
