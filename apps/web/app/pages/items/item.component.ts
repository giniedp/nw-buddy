import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { observeRouteParam } from '~/utils'

@Component({
  templateUrl: './item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content xl:max-w-md bg-base-300 rounded-md',
  },
})
export class ItemComponent {
  public itemId = observeRouteParam(this.route, 'id')
  public constructor(private route: ActivatedRoute) {
    //
  }
}
