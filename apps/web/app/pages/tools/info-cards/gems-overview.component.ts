import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getIngretientsFromRecipe, getItemIdFromRecipe } from '~/nw/utils'
import { ContentVisibilityDirective } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
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
  styleUrls: ['./gems-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, ScreenshotModule, ContentVisibilityDirective],
  host: {
    class: 'layout-row',
  },
  animations: [
    trigger('listAnimation', [
      transition('void => *', [
        query(':enter', [style({ opacity: 0 }), stagger(50, [animate('0.3s', style({ opacity: 1 }))])]),
      ]),
    ]),
    trigger('apperAnimation', [
      state('*', style({ opacity: 0 })),
      state('true', style({ opacity: 1 })),
      transition('* => true', [animate('0.3s')]),
    ]),
  ]
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
      return recipes.map((recipe): RecipeWithItem => {
        const itemId = getItemIdFromRecipe(recipe)
        return {
          ...recipe,
          $itemId: itemId,
          $item: items.get(itemId) || housing.get(itemId),
          $ingredients: getIngretientsFromRecipe(recipe).map((it) => {
            const ingId = it.type === 'Category_Only' ?'SolventT5' : it.ingredient
            return {
              quantity: it.quantity,
              item: items.get(ingId),
            }
          }),
        }
      }).filter((it) => it.$item?.Tier === 5)
    })
  )

  public constructor(private db: NwDbService) {
    //
  }
}
