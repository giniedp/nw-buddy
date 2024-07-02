import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgLink } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectQueryParam, observeRouteParam } from '~/utils'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { GatherableDetailModule } from '~/widgets/data/gatherable-detail'
import { GatherableDetailStore } from '~/widgets/data/gatherable-detail/gatherable-detail.store'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail-page',
  templateUrl: './gatherable-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    LootModule,
    IconsModule,
    TooltipModule,
    GatherableDetailModule,
    GameEventDetailModule,
    LayoutModule,
  ],
  providers: [GatherableDetailStore],
  host: {
    class: 'block',
  },
})
export class ItemDetailPageComponent {
  protected store = inject(GatherableDetailStore)

  protected itemId = toSignal(observeRouteParam(this.route, 'id'))
  protected tabId = toSignal(injectQueryParam('tab'))
  protected tag = toSignal(injectQueryParam('tag'))

  protected iconLink = svgLink
  protected viewerActive = false
  public constructor(
    private route: ActivatedRoute,
    private head: HtmlHeadService,
    private i18n: TranslateService,
  ) {
    effect(() => this.store.load(this.itemId()), { allowSignalWrites: true })
    effect(() => this.updateMeta())
  }

  private updateMeta() {
    this.head.updateMetadata({
      title: this.i18n.get(this.store.name()),
      description: '',
      url: this.head.currentUrl,
      image: `${this.head.origin}/${this.store.icon()}`,
    })
  }
}
