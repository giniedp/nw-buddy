import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef, OnChanges } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster, ItemdefinitionsAmmo } from '@nw-data/types'
import { combineLatest, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public itemId: string

  @Input()
  public recipeId: string

  @Input()
  public housingId: string

  public item: ItemDefinitionMaster
  public recipe: Crafting
  public housing: Housingitems

  public get itemDescription(): string {
    return this.item?.Description || this.housing?.Description
  }
  public itemRarity: number
  public itemRarityName: string
  public perks: Array<{ id: string, name: string, description: string, icon: string }>
  public perkBuckets: Array<{ type: string, chance: number, icon: string }>

  private change$ = new ReplaySubject<{
    itemId: string,
    housingId: string,
    recipeId: string
  }>(1)
  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {

    combineLatest({
      input: this.change$,
      itemsMap: this.nw.db.itemsMap,
      housingMap: this.nw.db.housingItemsMap,
      craftingMap: this.nw.db.recipesMap,
      craftingList: this.nw.db.recipes,
    })
      .pipe(map(({ input, craftingMap, craftingList, housingMap, itemsMap }) => {

        let item: ItemDefinitionMaster
        let housing: Housingitems
        let recipe: Crafting

        if (input.itemId || input.housingId) {
          item = itemsMap.get(input.itemId)
          housing = housingMap.get(input.housingId)
          recipe = this.nw.recipeForItem(item || housing, craftingList)
        } else {
          recipe = craftingMap.get(input.recipeId)
          const itemId = this.nw.itemIdFromRecipe(recipe)
          housing = housingMap.get(itemId)
          item = itemsMap.get(itemId)
        }

        return {
          recipe,
          housing,
          item,
        }
      }))
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ recipe, housing, item }) => {
        this.item = item
        this.housing = housing
        this.recipe = recipe

        this.itemId = item?.ItemID
        this.housingId = housing?.HouseItemID
        this.recipeId = recipe?.RecipeID

        this.cdRef.markForCheck()
      })

  }

  public ngOnChanges(): void {
    if (this.recipeId) {
      this.itemId = null
      this.housingId = null
    } else {
      this.recipeId = null
    }
    this.change$.next({
      itemId: this.itemId,
      housingId: this.housingId,
      recipeId: this.recipeId
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
