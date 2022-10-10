import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { getItemIdFromRecipe } from '~/nw/utils'
import { observeRouteParam } from '~/utils'

@Component({
  selector: 'nwb-crafting-detail',
  templateUrl: './crafting-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content flex-none max-w-lg'
  }
})
export class CraftingDetailComponent {
  protected id$ = observeRouteParam(this.route, 'id')
  protected recipe$ = this.db.recipe(this.id$)
  protected itemId$ = this.recipe$.pipe(map((it) => getItemIdFromRecipe(it)))

  public constructor(private route: ActivatedRoute, private db: NwDbService) {
    //
  }
}
