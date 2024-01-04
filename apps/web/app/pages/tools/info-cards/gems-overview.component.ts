import { animate, animateChild, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getCraftingIngredients, getItemIdFromRecipe } from '@nw-data/common'
import { ItemFrameModule } from '~/ui/item-frame'
import { PaginationModule } from '~/ui/pagination'
import { ContentVisibilityDirective, HtmlHeadService } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

function isGemItem(item: Crafting) {
  return item.CraftingCategory === 'CutGems'
}

type RecipeWithItem = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
  $itemId: string
  $ingredients: Array<{
    quantity: number
    item: ItemDefinitionMaster | Housingitems
  }>
}

@Component({
  standalone: true,
  selector: 'nwb-gems-overview',
  templateUrl: './gems-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemDetailModule,
    ScreenshotModule,
    ContentVisibilityDirective,
    ItemFrameModule,
    PaginationModule,
  ],
  host: {
    class: 'layout-col',
  },
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(25, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-1rem)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class GemsOverviewComponent {
  protected recipes = defer(() => this.db.recipes).pipe(map((it) => it.filter(isGemItem)))

  protected items$ = defer(() =>
    combineLatest({
      recipes: this.recipes,
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
    })
  ).pipe(
    map(({ recipes, items, housing }) => {
      return recipes
        .map((recipe): RecipeWithItem => {
          const itemId = getItemIdFromRecipe(recipe)
          return {
            ...recipe,
            $itemId: itemId,
            $item: items.get(itemId) || housing.get(itemId),
            $ingredients: getCraftingIngredients(recipe).map((it) => {
              const ingId = it.type === 'Category_Only' ? 'SolventT5' : it.ingredient
              return {
                quantity: it.quantity,
                item: items.get(ingId),
              }
            }),
          }
        })
        .filter((it) => it.$item?.Tier === 5)
    })
  )

  public constructor(private db: NwDbService, head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Gems Overview',
      description: 'Overview of all gems and their effect in New World',
    })
  }
}
