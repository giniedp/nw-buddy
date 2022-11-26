import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-housing-detail',
  templateUrl: './housing-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, ItemDetailModule, ScreenshotModule, LayoutModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class HousingDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')
  public constructor(private route: ActivatedRoute) {
    //
  }
}
