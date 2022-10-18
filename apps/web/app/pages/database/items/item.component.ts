import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { observeRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'

@Component({
  standalone: true,
  templateUrl: './item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, ItemDetailModule],
  host: {
    class: 'layout-content xl:max-w-md',
  },
})
export class ItemComponent {
  public itemId = observeRouteParam(this.route, 'id')
  public constructor(private route: ActivatedRoute) {
    //
  }
}
