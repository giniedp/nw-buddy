import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnChanges,
} from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { BehaviorSubject, combineLatest, defer, map } from 'rxjs'
import { NwService } from '~/core/nw'
import { getItemIdFromRecipe, getItemPerks, getRecipeForItem } from '~/core/nw/utils'
import { shareReplayRefCount } from '~/core/utils'

@Component({
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bg-base-300 rounded-md',
  },
})
export class ItemDetailComponent implements OnChanges {
  @Input()
  public set itemId(value: string) {
    this.itemId$.next(value)
  }
  public get itemId() {
    return this.itemId$.value
  }

  @Input()
  public set recipeId(value: string) {
    this.recipeId$.next(value)
  }
  public get recipeId() {
    return this.recipeId$.value
  }

  @Input()
  public enableNwdbLink: boolean

  @Input()
  public enableMarker: boolean

  @Input()
  public enableTracker: boolean

  @Input()
  public enableRecipe: boolean

  @Input()
  public enableDescription: boolean

  public entity$ = defer(() => this.source$).pipe(map((it) => it.item || it.housing))
  public item$ = defer(() => this.source$).pipe(map((it) => it.item))
  public housing$ = defer(() => this.source$).pipe(map((it) => it.housing))
  public recipe$ = defer(() => this.source$).pipe(map((it) => it.recipe))
  public description$ = defer(() => this.source$).pipe(map(({ item, housing }) => item?.Description || housing?.Description))
  public perks$ = defer(() => this.source$).pipe(map((it) => it.perks))

  public isLoading = true

  private itemId$ = new BehaviorSubject<string>(null)
  private recipeId$ = new BehaviorSubject<string>(null)
  private source$ = defer(() =>
    combineLatest({
      itemId: this.itemId$,
      recipeId: this.recipeId$,

      perksMap: this.nw.db.perksMap,
      itemsMap: this.nw.db.itemsMap,
      housingMap: this.nw.db.housingItemsMap,
      craftingMap: this.nw.db.recipesMap,
      craftingList: this.nw.db.recipes,
    })
  ).pipe(
    map(({ itemId, recipeId, craftingMap, craftingList, housingMap, itemsMap, perksMap }) => {
      let item: ItemDefinitionMaster
      let housing: Housingitems
      let recipe: Crafting
      if (itemId) {
        item = itemsMap.get(itemId)
        housing = housingMap.get(itemId)
        recipe = getRecipeForItem(item || housing, craftingList)
      } else if (recipeId) {
        recipe = craftingMap.get(recipeId)
        const itemId = getItemIdFromRecipe(recipe)
        housing = housingMap.get(itemId)
        item = itemsMap.get(itemId)
      }
      return {
        recipe,
        housing,
        item,
        perks: item && getItemPerks(item, perksMap),
      }
    })
  )
  .pipe(shareReplayRefCount(1))

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnChanges(): void {
    this.cdRef.detectChanges()
  }
}
