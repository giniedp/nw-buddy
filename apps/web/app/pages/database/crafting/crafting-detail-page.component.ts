import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { getItemIconPath, getItemIdFromRecipe } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { CraftingCalculatorComponent } from '~/widgets/crafting'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-crafting-detail-page',
  templateUrl: './crafting-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ItemDetailModule,
    CraftingCalculatorComponent,
    ScreenshotModule,
    LayoutModule,
  ],
  host: {
    class: 'block',
  },
})
export class CraftingDetailPageComponent {
  protected id$ = injectRouteParam('id')
  protected recipe$ = this.db.recipe(this.id$)
  protected itemId$ = this.recipe$.pipe(map((it) => getItemIdFromRecipe(it)))

  public constructor(
    private db: NwDataService,
    private i18n: TranslateService,
    private head: HtmlHeadService,
  ) {
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
      image: `${this.head.origin}/${getItemIconPath(entity)}`,
    })
  }
}
