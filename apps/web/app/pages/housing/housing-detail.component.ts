import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { observeRouteParam } from '~/utils'

@Component({
  selector: 'nwb-housing-detail',
  templateUrl: './housing-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content xl:max-w-md bg-base-300 rounded-md',
  }
})
export class HousingDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')
  public constructor(private route: ActivatedRoute) {
    //
  }
}
