import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { injectRouteParam } from '~/utils'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-pvp-rank-detail-page',
  templateUrl: './pvp-rank-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, GameEventDetailModule, ScreenshotModule, LayoutModule, LootModule],
  host: {
    class: 'block',
  },
})
export class PvpRankDetailPageComponent {
  protected eventId = toSignal(injectRouteParam('id'))
}
