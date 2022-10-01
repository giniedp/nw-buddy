import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { BehaviorSubject, combineLatest, defer, map, NEVER, of, switchMap, take } from 'rxjs'
import { NwDbService, NwVitalsService } from '~/nw'
import {
  getItemId,
  getItemIdFromRecipe,
  getItemPerkBucket,
  getItemPerks,
  getPerkbucketPerks,
  getRecipeForItem,
  isItemWeapon,
  isMasterItem,
} from '~/nw/utils'
import { shareReplayRefCount } from '~/utils'

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

  public readonly salvageEvent$ = defer(() => this.entity$)
    .pipe(map((it) => it.SalvageGameEventID))
    .pipe(switchMap((id) => this.db.gameEvent(id)))
    .pipe(shareReplayRefCount(1))

  public readonly weapon$ = defer(() => this.item$)
    .pipe(switchMap((it) => (!isItemWeapon(it) ? NEVER : this.db.weaponsMap)))
    .pipe(shareReplayRefCount(1))

  public readonly perks$ = defer(() =>
    combineLatest({
      item: this.item$,
      perks: this.db.perksMap,
      buckets: this.db.perkBucketsMap,
    })
  )
    .pipe(
      map(({ item, perks, buckets }) => {
        if (item?.IngredientCategories?.includes('PerkItem')) {
          return getPerkbucketPerks(buckets.get(item.ItemID), perks)
        }
        return item && getItemPerks(item, perks)
      })
    )
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

  public droppedByVitals$ = defer(() => this.entityid$).pipe(
    switchMap((id) => {
      return this.vitals.vitalsThatCanDrop(id ? [id] : [])
    })
  )

  private idOrEntity$ = new BehaviorSubject<string | ItemDefinitionMaster | Housingitems>(null)
  private idOrRecipe$ = new BehaviorSubject<string | Crafting>(null)

  public constructor(private db: NwDbService, private vitals: NwVitalsService) {
    //
  }

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
