import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { getQuestTypeIcon } from '@nw-data/common'
import { Objective } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { DestroyService, HtmlHeadService, observeRouteParam } from '~/utils'
import { QuestDetailModule } from '~/widgets/data/quest-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-quest-detail-page',
  templateUrl: './quest-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    QuestDetailModule,
    ScreenshotModule,
    LayoutModule,
    LootModule,
    IconsModule,
  ],
  providers: [DestroyService],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class QuestDetailPageComponent {
  protected itemId$ = observeRouteParam(this.route, 'id')

  protected iconLink = svgSquareArrowUpRight
  public constructor(
    private route: ActivatedRoute,
    private dialog: Dialog,
    private head: HtmlHeadService,
    private i18n: TranslateService
  ) {
    //
  }

  protected onEntity(entity: Objective) {
    if (!entity) {
      return
    }
    this.head.updateMetadata({
      title: this.i18n.get(entity.Title),
      description: this.i18n.get(entity.Description),
      url: this.head.currentUrl,
      image: `${this.head.origin}/${getQuestTypeIcon(entity.Type)}`,
    })
  }

  // protected openRepairRecipe(tpl: TemplateRef<any>) {
  //   this.dialog.open(tpl, {
  //     panelClass: ['w-full', 'h-full', 'max-w-4xl', 'layout-pad', 'shadow'],
  //   })
  // }

  // protected closeDialog() {
  //   this.dialog.closeAll()
  // }
}
