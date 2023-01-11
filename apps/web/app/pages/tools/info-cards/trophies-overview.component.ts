import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { Crafting, Housingitems } from '@nw-data/types'
import { groupBy } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getIngretientsFromRecipe, getItemId, getRecipeForItem } from '~/nw/utils'
import { ItemFrameModule } from '~/ui/item-frame'
import { ContentVisibilityDirective, HtmlHeadService } from '~/utils'
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
  template: `
    <div class="min-w-[1100px] max-w-[1500px] mx-auto mb-20 content-auto" *ngIf="rows$ | async; let rows">
      <div class="grid grid-cols-3 layout-gap" [nwbScreenshotFrame]="'Trophies'" [@listAnimation]="rows.length">
        <ng-container *ngFor="let row of rows; trackBy: trackByIndex">
          <nwb-item-card
            [disableInfo]="true"
            [entityId]="item.itemId"
            [enableTracker]="true"
            *ngFor="let item of row; trackBy: trackByIndex"
            nwbContentVisibility
          >
            <nwb-item-divider class="mx-4"></nwb-item-divider>
            <div class="flex flex-col gap-1 p-4">
              <div
                *ngFor="let ingr of item.ingredients; trackBy: trackByIndex"
                class="flex flex-row gap-1 justify-start items-center"
              >
                <picture [nwIcon]="ingr.item" class="w-8 h-8 nw-icon flex-none"></picture>
                <span>{{ ingr.quantity }}</span>
                <span>&times;</span>
                <span [nwText]="ingr.item.Name"></span>
              </div>
            </div>
          </nwb-item-card>
        </ng-container>
      </div>
    </div>
  `,
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

  public constructor(private db: NwDbService, head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Trophies',
      description: 'Overview of all trophies in new World',
    })
  }
}
