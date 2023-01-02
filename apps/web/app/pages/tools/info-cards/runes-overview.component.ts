import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { groupBy } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getIngretientsFromRecipe, getItemId, getItemIdFromRecipe } from '~/nw/utils'
import { HtmlHeadService } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

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
  standalone: true,
  selector: 'nwb-runes-overview',
  templateUrl: './runes-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, ScreenshotModule],
  host: {
    class: 'layout-content layout-pad',
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
export class RunesOverviewComponent {
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

  protected rows$ = defer(() => this.runes).pipe(
    map((list) => {
      const groups = groupBy(list, (it) => getItemId(it.$item).replace(/T[0-9][a-zA-Z]?$/i, ''))
      return Array.from(Object.values(groups))
    })
  )

  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(private db: NwDbService, head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Heart Runes',
      description: 'Overview of all heart runes in New World.',
    })
  }
}
