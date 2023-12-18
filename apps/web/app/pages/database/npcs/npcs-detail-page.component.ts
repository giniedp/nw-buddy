import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, observeRouteParam, selectSignal, selectStream } from '~/utils'
import { GatherableDetailModule } from '~/widgets/data/gatherable-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-npcs-detail-page',
  templateUrl: './npcs-detail-page.component.html',
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
export class NpcDetailPageComponent {
  protected db = inject(NwDbService)
  protected itemId$ = observeRouteParam(this.route, 'id')
  protected data = selectSignal(this.db.npc(this.itemId$))

  protected icon = NW_FALLBACK_ICON
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
