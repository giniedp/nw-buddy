import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getItemIdFromRecipe } from '~/nw/utils'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { CraftingCalculatorModule } from '~/widgets/crafting-calculator'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-crafting-detail',
  templateUrl: './crafting-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, ItemDetailModule, CraftingCalculatorModule, ScreenshotModule, LayoutModule],
  host: {
    class: 'flex-none flex flex-col bg-base-300',
  },
})
export class CraftingDetailComponent {
  protected id$ = observeRouteParam(this.route, 'id')
  protected recipe$ = this.db.recipe(this.id$)
  protected itemId$ = this.recipe$.pipe(map((it) => getItemIdFromRecipe(it)))

  public constructor(private route: ActivatedRoute, private db: NwDbService) {
    //
  }
}
