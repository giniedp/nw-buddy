import { animate, animateChild, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { Crafting, ItemDefinitionMaster } from '@nw-data/generated'
import { combineLatest, debounceTime, defer, map, startWith, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { getIngretientsFromRecipe, getItemIdFromRecipe } from '@nw-data/common'
import { ItemPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgRepeat } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PaginationModule } from '~/ui/pagination'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ContentVisibilityDirective, HtmlHeadService, tapDebug } from '~/utils'
import { IntersectionObserverModule } from '~/utils/intersection-observer'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { ScreenshotModule } from '~/widgets/screenshot'

interface RecipeItem {
  recipe: Crafting
  recipeItem: ItemDefinitionMaster
  itemId: string
  item: ItemDefinitionMaster
  ingredients: Array<{
    quantity: number
    item: ItemDefinitionMaster
  }>
  flipped?: boolean
}

function isRecipe(item: ItemDefinitionMaster) {
  return item.TradingGroup === 'Recipes'
}

@Component({
  standalone: true,
  selector: 'nwb-recipes-overview',
  templateUrl: './recipes-overview.component.html',
  styleUrls: ['./recipes-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemDetailModule,
    ScreenshotModule,
    IntersectionObserverModule,
    ContentVisibilityDirective,
    ItemTrackerModule,
    ItemFrameModule,
    IconsModule,
    PaginationModule
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
export class RecipesOverviewComponent {
  protected iconFlip = svgRepeat
  protected source$ = defer(() =>
    combineLatest({
      items: this.db.itemsMap,
      recipes: this.db.recipes,
    })
  ).pipe(
    map(({ recipes, items }) => {
      return recipes
        .map((recipe): RecipeItem => {
          const itemId = getItemIdFromRecipe(recipe)
          const item = items.get(itemId)
          if (!item) {
            return null
          }
          const recipeItem = items.get(recipe.RequiredAchievementID)
          if (!recipeItem || !isRecipe(recipeItem)) {
            return null
          }
          return {
            item: item,
            itemId: itemId,
            recipeItem: recipeItem,
            recipe: recipe,
            ingredients: getIngretientsFromRecipe(recipe).map((it) => {
              return {
                quantity: it.quantity,
                item: items.get(it.ingredient),
              }
            }),
          }
        })
        .filter((it) => !!it)
    })
  )
  protected items$ = combineLatest({
    items: this.source$,
    search: this.search.query$.pipe(debounceTime(300), startWith('')),
    locale: this.i18n.locale.value$,
  }).pipe(
    map(({ items, search }) => {
      if (!search) {
        return items
      }
      search = search.toLowerCase()
      return items.filter((it) => {
        return (
          this.testText(it.item.Name, search) ||
          this.testText(it.item.Description, search) ||
          this.testText(it.recipeItem.Name, search) ||
          this.testText(it.recipeItem.Description, search)
        )
      })
    })
  )
  protected stats$ = this.source$.pipe(switchMap((list) => {
    return combineLatest(list.map((it) => this.itemPref.observe(it.recipeItem.ItemID)))
  }))
  .pipe(map((list) => {
    const total = list.length
    const learned = list.filter((it) => !!it.meta?.mark).length
    return {
      total: total,
      learned: learned,
      percent: learned / total
    }
  }))

  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(
    private db: NwDbService,
    private search: QuicksearchService,
    private i18n: TranslateService,
    private itemPref: ItemPreferencesService,
    head: HtmlHeadService
  ) {
    head.updateMetadata({
      title: 'Cooking Recipes',
      description: 'Overview of all cooking recipes in New World.',
    })
  }

  private testText(key: string, query: string) {
    return this.i18n.get(key)?.toLowerCase()?.includes(query)
  }
}
