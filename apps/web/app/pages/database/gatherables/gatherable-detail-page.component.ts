import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgLink } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectQueryParam, injectRouteParam } from '~/utils'
import { GameEventDetailModule } from '~/widgets/data/game-event-detail'
import { GatherableDetailModule } from '~/widgets/data/gatherable-detail'
import { GatherableDetailStore } from '~/widgets/data/gatherable-detail/gatherable-detail.store'
import { LootModule } from '~/widgets/loot'

@Component({
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
export class GatherableDetailPageComponent {
  protected store = inject(GatherableDetailStore)

  protected itemId = toSignal(injectRouteParam('id'))
  protected tabId = toSignal(injectQueryParam('tab'))
  protected tag = toSignal(injectQueryParam('tag'))

  protected iconLink = svgLink
  protected viewerActive = false
  public constructor(
    private head: HtmlHeadService,
    private i18n: TranslateService,
  ) {
    effect(() => {
      const id = this.itemId()
      untracked(() => this.store.load({ gatherableId: id }))
    })
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
