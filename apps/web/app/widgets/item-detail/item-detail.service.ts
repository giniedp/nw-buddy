import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { BehaviorSubject, combineLatest, defer, map, of, switchMap, take } from 'rxjs'
import { NwDbService } from '~/core/nw'
import {
  getItemId,
  getItemIdFromRecipe,
  getItemPerkBucket,
  getItemPerkIds,
  getItemPerks,
  getPerkbucketPerks,
  getRecipeForItem,
  isMasterItem,
} from '~/core/nw/utils'
import { shareReplayRefCount } from '~/core/utils'

import { Injectable } from '@angular/core'

@Injectable()
export class ItemDetailService {
  public readonly entity$ = defer(() => this.idOrEntity$)
    .pipe(
      switchMap((it) => {
        if (typeof it !== 'string') {
          return of(it)
        }
        return combineLatest({
          items: this.db.itemsMap,
          housings: this.db.housingItemsMap,
        }).pipe(
          map(({ items, housings }) => {
            return items.get(it) || housings.get(it)
          })
        )
      })
    )
    .pipe(shareReplayRefCount(1))

  public readonly recipe$ = defer(() => this.idOrRecipe$).pipe(
    switchMap((it) => {
      if (typeof it !== 'string') {
        return of(it)
      }
      return this.db.recipesMap.pipe(map((recipes) => recipes.get(it)))
    })
  )

  public readonly entityid$ = defer(() => this.entity$)
    .pipe(map((it) => getItemId(it)))
    .pipe(shareReplayRefCount(1))

  public readonly item$ = defer(() => this.entity$)
    .pipe(map((it) => (isMasterItem(it) ? it : null)))
    .pipe(shareReplayRefCount(1))

  public readonly housingItem$ = defer(() => this.entity$)
    .pipe(map((it) => (!isMasterItem(it) ? it : null)))
    .pipe(shareReplayRefCount(1))

  public readonly perks$ = defer(() =>
    combineLatest({
      item: this.item$,
      perks: this.db.perksMap,
      buckets: this.db.perkBucketsMap
    })
  )
    .pipe(map(({ item, perks, buckets }) => {
      if (item?.IngredientCategories?.includes('PerkItem')) {
        return getPerkbucketPerks(buckets.get(item.ItemID), perks)
      }
      return item && getItemPerks(item, perks)
    }))
    .pipe(shareReplayRefCount(1))

  public readonly perkBuckets$ = defer(() =>
    combineLatest({
      item: this.item$,
      perks: this.db.perkBucketsMap,
    })
  )
    .pipe(map(({ item, perks }) => item && getItemPerkBucket(item, perks)))
    .pipe(shareReplayRefCount(1))

  public description$ = defer(() => this.entity$).pipe(map((it) => it?.Description))

  private idOrEntity$ = new BehaviorSubject<string | ItemDefinitionMaster | Housingitems>(null)
  private idOrRecipe$ = new BehaviorSubject<string | Crafting>(null)

  public constructor(private db: NwDbService) {}

  public update(idOrEntity: string | ItemDefinitionMaster | Housingitems) {
    this.idOrEntity$.next(idOrEntity)
    combineLatest({
      item: this.item$,
      recipes: this.db.recipes,
    })
      .pipe(take(1))
      .subscribe(({ item, recipes }) => {
        getRecipeForItem(item, recipes)
      })
  }

  public updateFromRecipe(idOrRecipe: string | Crafting) {
    this.idOrRecipe$.next(idOrRecipe)
    this.recipe$.pipe(take(1)).subscribe((it) => {
      this.idOrEntity$.next(getItemIdFromRecipe(it))
    })
  }
}
