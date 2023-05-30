import { animate, animateChild, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { Crafting, Housingitems } from '@nw-data/generated'
import { groupBy, sortBy } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { getIngretientsFromRecipe, getItemId, getRecipeForItem } from '~/nw/utils'
import { ItemFrameModule } from '~/ui/item-frame'
import { QuicksearchService } from '~/ui/quicksearch'
import { ContentVisibilityDirective, HtmlHeadService } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
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
  imports: [
    CommonModule,
    NwModule,
    ItemDetailModule,
    ScreenshotModule,
    ContentVisibilityDirective,
    ItemFrameModule,
    IonicModule,
  ],
  host: {
    class: 'layout-content layout-pad',
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
          name: this.tl8.get(housing.Name),
          recipe: recipe,
          ingredients: ingredients,
        }
      })
    }),
    map((list) => sortBy(list, (it) => it.itemId)),
    map((list) => groupBy(list, (it) => it.itemId.replace(/_T\d$/, ''))),
    map((list) => Object.values(list)),
    map((list) => sortBy(list, (it) => it.length).reverse().flat()),
    map((list) => list.filter((it) => !it.itemId.endsWith('_T0')))
  )

  protected filteredItems$ = combineLatest({
    items: this.items$,
    query: this.search.query$
  }).pipe(map(({ items, query }) => {
    if (!query) {
      return items
    }
    return items.filter((it) => it.name?.toLowerCase().includes(query))
  }))

  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(private db: NwDbService, private search: QuicksearchService, private tl8: TranslateService, head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Trophies',
      description: 'Overview of all trophies in new World',
    })
  }
}
