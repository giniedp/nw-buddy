import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { DataViewService } from '~/ui/data/data-view'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam } from '~/utils'
import { RecipeCellComponent, RecipeRecord } from './adapter'
import { ActivatedRoute } from '@angular/router'
import { map } from 'rxjs'

@Component({
  selector: 'nwb-recipes-tracking',
  templateUrl: './recipes-tracking.component.html',
  styleUrl: './recipes-tracking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, VirtualGridModule],
  host: {
    class: 'ion-page',
  },
})
export class RecipesTrackingComponent {
  public constructor(
    private route: ActivatedRoute,
    protected service: DataViewService<RecipeRecord>,
  ) {
    //
  }
}
