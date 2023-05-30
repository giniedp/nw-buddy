import { animate, animateChild, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest, debounceTime, defer, map, startWith, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { getIngretientsFromRecipe, getItemId, getItemIdFromRecipe } from '~/nw/utils'
import { ItemPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgRepeat, svgRotate } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PaginationModule } from '~/ui/pagination'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ContentVisibilityDirective, HtmlHeadService, shareReplayRefCount, tapDebug } from '~/utils'
import { IntersectionObserverModule } from '~/utils/intersection-observer'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { ScreenshotModule } from '~/widgets/screenshot'

interface RecipeItem {
  recipe: Crafting
  recipeItem: ItemDefinitionMaster
  itemId: string
  item: ItemDefinitionMaster | Housingitems
  ingredients: Array<{
    quantity: number
    item: ItemDefinitionMaster | Housingitems
    itemId: string
  }>
  flipped?: boolean
}
function isSchematic(item: ItemDefinitionMaster) {
  return item.ItemClass?.includes('WeaponSchematic') || item.ItemClass?.includes('FurnitureSchematic')
}

@Component({
  standalone: true,
  selector: 'nwb-recipes-overview',
  templateUrl: './schematics-overview.component.html',
  styleUrls: ['./schematics-overview.component.scss'],
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
    QuicksearchModule,
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
export class SchematicsOverviewComponent extends ComponentStore<State> {
  protected iconFlip = svgRepeat
  protected trackByIndex: TrackByFunction<any> = (i) => i
  protected source$ = this.source().pipe(shareReplayRefCount(1))
  protected filter$ = this.select(({ filter }) => filter)
  protected filteredSource$ = combineLatest({
    items: this.source$,
    filter: this.filter$,
  }).pipe(
    map(({ items, filter }) => {
      if (filter) {
        items = items.filter((it) => it.recipe.Tradeskill === filter)
      }
      return items
    })
  )
  protected stats$ = this.filteredSource$.pipe(switchMap((list) => {
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

  protected items$ = combineLatest({
    items: this.filteredSource$,
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

  protected filterOptions$ = this.source$.pipe(
    map((source) => {
      return uniq(source.map((it) => it.recipe.Tradeskill)).filter((it) => !!it)
    })
  )

  public constructor(
    private db: NwDbService,
    private search: QuicksearchService,
    private i18n: TranslateService,
    private itemPref: ItemPreferencesService,
    head: HtmlHeadService
  ) {
    super({
      filter: null,
    })
    head.updateMetadata({
      title: 'Schematics Recipes',
      description: 'Overview of all schematics in New World.',
    })
  }

  private testText(key: string, query: string) {
    return this.i18n.get(key)?.toLowerCase()?.includes(query)
  }
  private source() {
    return combineLatest({
      items: this.db.itemsMap,
      itemsBySalvage: this.db.itemsBySalvageAchievement,
      housingItems: this.db.housingItemsMap,
      recipes: this.db.recipes,
      events: this.db.gameEventsMap,
    }).pipe(
      map(({ recipes, items, itemsBySalvage, housingItems }) => {
        return recipes
          .map((recipe): RecipeItem => {
            const candidates = itemsBySalvage.get(recipe.RequiredAchievementID)
            const recipeItem = candidates?.find((it) => isSchematic(it))
            if (!recipeItem || !isSchematic(recipeItem)) {
              return null
            }
            const itemId = getItemIdFromRecipe(recipe)
            const item = items.get(itemId) || housingItems.get(itemId)
            if (!item) {
              return null
            }

            return {
              itemId: itemId,
              item: item,
              recipeItem: recipeItem,
              recipe: recipe,
              ingredients: getIngretientsFromRecipe(recipe).map((it) => {
                const item = items.get(it.ingredient) || housingItems.get(it.ingredient)
                return {
                  quantity: it.quantity,
                  item: items.get(it.ingredient) || housingItems.get(it.ingredient),
                  itemId: getItemId(item),
                }
              }),
            }
          })
          .filter((it) => !!it)
      })
    )
  }
}

interface State {
  filter: string
}
