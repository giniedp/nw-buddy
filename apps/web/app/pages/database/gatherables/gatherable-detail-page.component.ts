import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgLink, svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectQueryParam, observeRouteParam } from '~/utils'
import { GatherableDetailModule } from '~/widgets/data/gatherable-detail'
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
    LayoutModule,
  ],
  providers: [],
  host: {
    class: 'block',
  },
})
export class ItemDetailPageComponent {
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
    //
  }

  // protected onEntity(entity: MasterItemDefinitions) {
  //   if (!entity) {
  //     return
  //   }
  //   this.head.updateMetadata({
  //     title: this.i18n.get(entity.Name),
  //     description: this.i18n.get(entity.Description),
  //     url: this.head.currentUrl,
  //     image: `${this.head.origin}/${getItemIconPath(entity)}`,
  //   })
  // }
}
