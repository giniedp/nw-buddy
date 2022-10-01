import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { observeRouteParam } from '~/utils'

@Component({
  templateUrl: './item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content flex-none max-w-lg'
  }
})
export class ItemComponent {
  public itemId = observeRouteParam(this.route, 'id')
  public constructor(private route: ActivatedRoute) {
    //
  }
}
