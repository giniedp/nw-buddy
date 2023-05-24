import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  templateUrl: './game-event-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, GameEventDetailModule, ScreenshotModule, LayoutModule, LootModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class GameEventDetailComponent {
  protected eventId$ = observeRouteParam(this.route, 'id')

  public constructor(
    private route: ActivatedRoute,
    private dialog: Dialog,
    private head: HtmlHeadService,
    private i18n: TranslateService,
    private db: NwDbService
  ) {
    //
  }
}
