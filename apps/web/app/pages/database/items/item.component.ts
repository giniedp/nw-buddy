import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { DestroyService, observeRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  templateUrl: './item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, ItemDetailModule, ScreenshotModule, LayoutModule],
  providers: [DestroyService],
  host: {
    class: 'flex-none flex flex-col bg-base-300',
  },
})
export class ItemComponent {
  protected itemId$ = observeRouteParam(this.route, 'id')

  public constructor(private route: ActivatedRoute) {
    //

  }

}
