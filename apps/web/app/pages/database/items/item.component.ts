import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { getItemIconPath } from '~/nw/utils'
import { LayoutModule } from '~/ui/layout'
import { DestroyService, HtmlHeadService, observeRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ModelViewerComponent } from '~/widgets/model-viewer'
import { ItemModelInfo } from '~/widgets/model-viewer/model-viewer.service'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  templateUrl: './item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, ItemDetailModule, ScreenshotModule, LayoutModule],
  providers: [DestroyService],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class ItemComponent {
  protected itemId$ = observeRouteParam(this.route, 'id')

  public constructor(
    private route: ActivatedRoute,
    private dialog: Dialog,
    private head: HtmlHeadService,
    private i18n: TranslateService
  ) {
    //

  }

  public openViewer(models: ItemModelInfo[]) {
    ModelViewerComponent.open(this.dialog, {
      panelClass: ['w-full', 'h-full'],
      data: models
    })
  }

  protected onEntity(entity: ItemDefinitionMaster) {
    if (!entity) {
      return
    }
    this.head.updateMetadata({
      title: this.i18n.get(entity.Name),
      description: this.i18n.get(entity.Description),
      url: this.head.currentUrl,
      image: `${this.head.origin}/${getItemIconPath(entity)}`
    })
  }
}
