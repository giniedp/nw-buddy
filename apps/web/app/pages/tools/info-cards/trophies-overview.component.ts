import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { groupBy } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getIngretientsFromRecipe, getItemId, getRecipeForItem } from '~/nw/utils'
import { ContentVisibilityDirective } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

function isTrophy(item: Crafting) {
  return item.CraftingGroup === 'Trophies'
}

function isTrophyItem(item: Housingitems) {
  return item.HousingTags?.includes('IsTrophyBuff')
}

@Component({
  standalone: true,
  selector: 'nwb-trophies-overview',
  templateUrl: './trophies-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, ScreenshotModule, ContentVisibilityDirective, IonicModule],
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
  ],
})
export class TrophiesOverviewComponent {
  protected housings$ = defer(() => this.db.housingItems).pipe(map((it) => it.filter(isTrophyItem)))
  protected recipes$ = defer(() => this.db.recipes).pipe(map((it) => it.filter(isTrophy)))

  protected items$ = defer(() =>
    combineLatest({
      recipes: this.recipes$,
      housings: this.housings$,
      items: this.db.itemsMap,
      housingItems: this.db.housingItemsMap,
    })
  ).pipe(
    map(({ recipes, items, housingItems, housings }) => {
      return housings.map((housing) => {
        const recipe = getRecipeForItem(housing, recipes)
        const ingredients = getIngretientsFromRecipe(recipe).map((it) => {
          return {
            quantity: it.quantity,
            item: items.get(it.ingredient) || housingItems.get(it.ingredient),
          }
        })

        return {
          itemId: getItemId(housing),
          item: housing,
          recipe: recipe,
          ingredients: ingredients,
        }
      })
    })
  )

  protected rows$ = defer(() => this.items$).pipe(
    map((list) => {
      const groups = groupBy(list, (it) => it.itemId.replace(/T[0-9][a-zA-Z]?$/i, ''))
      return Array.from(Object.values(groups))
    })
  )

  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(private db: NwDbService) {
    //
  }
}
