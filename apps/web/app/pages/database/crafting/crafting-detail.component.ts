import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { map, tap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { getItemIconPath, getItemIdFromRecipe } from '~/nw/utils'
import { LayoutModule } from '~/ui/layout'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { CraftingCalculatorModule } from '~/widgets/crafting-calculator'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-crafting-detail-page',
  templateUrl: './crafting-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, ItemDetailModule, CraftingCalculatorModule, ScreenshotModule, LayoutModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class CraftingDetailComponent {
  protected id$ = observeRouteParam(this.route, 'id')
  protected recipe$ = this.db.recipe(this.id$)
  protected itemId$ = this.recipe$.pipe(map((it) => getItemIdFromRecipe(it)))

  public constructor(private route: ActivatedRoute, private db: NwDbService, private i18n: TranslateService, private head: HtmlHeadService) {
    //
  }

  protected onEntity(entity: ItemDefinitionMaster | Housingitems) {
    if (!entity) {
      return
    }
    this.head.updateMetadata({
      title: [this.i18n.get(entity.Name), 'Recipe'].join(' - '),
      description: this.i18n.get(entity.Description),
      url: this.head.currentUrl,
      image: `${this.head.origin}/${getItemIconPath(entity)}`
    })
  }
}
