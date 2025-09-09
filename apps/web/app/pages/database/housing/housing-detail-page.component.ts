import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { getItemIconPath } from '@nw-data/common'
import { HouseItems } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'
import { ItemTabsComponent } from '../items/item-tabs.component'
import { ItemDetailModelViewerComponent } from '../items/ui/item-detail-model-viewer.component'

@Component({
  selector: 'nwb-housing-detail-page',
  templateUrl: './housing-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, ItemDetailModule, ScreenshotModule, ItemTabsComponent, ItemDetailModelViewerComponent],
  host: {
    class: 'block',
  },
})
export class HousingDetailPageComponent {
  protected itemId = toSignal(injectRouteParam('id'))

  public constructor(
    private i18n: TranslateService,
    private head: HtmlHeadService,
  ) {
    //
  }

  protected onEntity(entity: HouseItems) {
    if (!entity) {
      return
    }
    this.head.updateMetadata({
      title: this.i18n.get(entity.Name),
      description: this.i18n.get(entity.Description),
      url: this.head.currentUrl,
      image: `${this.head.origin}/${getItemIconPath(entity)}`,
    })
  }
}
