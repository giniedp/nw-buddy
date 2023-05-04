import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Housingitems } from '@nw-data/types'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { getItemIconPath } from '~/nw/utils'
import { LayoutModule } from '~/ui/layout'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { ScreenshotModule } from '~/widgets/screenshot'
import { HousingTabsComponent } from './housing-detail-tabs.component'

@Component({
  standalone: true,
  selector: 'nwb-housing-detail-page',
  templateUrl: './housing-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ItemDetailModule,
    StatusEffectDetailModule,
    ScreenshotModule,
    LayoutModule,
    HousingTabsComponent,
  ],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class HousingDetailComponent {
  public itemId$ = observeRouteParam(this.route, 'id')
  public constructor(private route: ActivatedRoute, private i18n: TranslateService, private head: HtmlHeadService) {
    //
  }

  protected onEntity(entity: Housingitems) {
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
