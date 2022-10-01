import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { groupBy } from 'lodash'
import { combineLatest, defer, map, tap } from 'rxjs'
import { NwDbService } from '~/nw'
import { getIngretientsFromRecipe, getItemId, getItemIdFromRecipe } from '~/nw/utils'
import { QuicksearchService } from '~/ui/quicksearch'

type RecipeWithItem = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
  $itemId: string
  $ingredients: Array<{
    quantity: number
    item: ItemDefinitionMaster | Housingitems
  }>
}

function isRunestone(it: Crafting) {
  return (
    it.Tradeskill === 'Stonecutting' &&
    (it.CraftingGroup === 'Rune' || it.CraftingGroup?.startsWith('UniqueDungeonReps'))
  )
}

@Component({
  selector: 'nwb-crafting-runes',
  templateUrl: './crafting-runes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content',
  },
})
export class CraftingRunesComponent {
  protected recipes = defer(() => this.db.recipes).pipe(map((it) => it.filter(isRunestone)))

  protected runes = defer(() =>
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
            return {
              quantity: it.quantity,
              item: items.get(it.ingredient) || housing.get(it.ingredient)
            }
          })
        }
      })
    })
  )

  protected rows = defer(() => this.runes).pipe(
    map((list) => {
      const groups = groupBy(list, (it) => getItemId(it.$item).replace(/T[0-9][a-zA-Z]?$/i, ''))
      return Array.from(Object.values(groups))
    })
  )

  public constructor(private db: NwDbService) {
    //
  }
}
