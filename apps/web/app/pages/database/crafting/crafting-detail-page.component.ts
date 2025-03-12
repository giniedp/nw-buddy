import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { getItemIconPath, getItemIdFromRecipe } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { TabsModule } from '~/ui/tabs'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { CraftingCalculatorComponent } from '~/widgets/crafting'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
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
    TabsModule,
    TooltipModule,
  ],
  host: {
    class: 'block',
  },
})
export class CraftingDetailPageComponent {
  private db = injectNwData()
  private i18n = inject(TranslateService)
  private head = inject(HtmlHeadService)
  protected id$ = injectRouteParam('id')
  protected id = toSignal(this.id$)

  protected recipe$ = this.id$.pipe(switchMap((id) => this.db.recipesById(id)))
  protected itemId$ = this.recipe$.pipe(map((it) => getItemIdFromRecipe(it)))
  protected showDetails = false
  protected onEntity(entity: MasterItemDefinitions | HouseItems) {
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
