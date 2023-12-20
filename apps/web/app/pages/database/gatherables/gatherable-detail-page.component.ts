import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { GatherableDetailModule } from '~/widgets/data/gatherable-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail-page',
  templateUrl: './gatherable-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ScreenshotModule,
    LootModule,
    IconsModule,
    TooltipModule,
    GatherableDetailModule,
    LayoutModule,
    ItemFrameModule
  ],
  providers: [],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class ItemDetailPageComponent {
  protected itemId = toSignal(observeRouteParam(this.route, 'id'))

  protected iconLink = svgSquareArrowUpRight
  protected viewerActive = false
  public constructor(
    private route: ActivatedRoute,
    private dialog: Dialog,
    private head: HtmlHeadService,
    private i18n: TranslateService
  ) {
    //
  }

  // protected onEntity(entity: ItemDefinitionMaster) {
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
