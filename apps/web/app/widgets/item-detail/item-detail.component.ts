import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef, OnChanges } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster, ItemdefinitionsAmmo } from '@nw-data/types'
import { BehaviorSubject, combineLatest, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public set itemId(value: string) {
    this.itemId$.next(value)
  }

  @Input()
  public set recipeId(value: string) {
    this.recipeId$.next(value)
  }

  @Input()
  public set housingId(value: string) {
    this.housingId$.next(value)
  }

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
  public isLoading = true

  private itemId$ = new BehaviorSubject<string>(null)
  private housingId$ = new BehaviorSubject<string>(null)
  private recipeId$ = new BehaviorSubject<string>(null)

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {

    combineLatest({
      itemId: this.itemId$,
      housingId: this.housingId$,
      recipeId: this.recipeId$,

      itemsMap: this.nw.db.itemsMap,
      housingMap: this.nw.db.housingItemsMap,
      craftingMap: this.nw.db.recipesMap,
      craftingList: this.nw.db.recipes,
    })
      .pipe(map(({ itemId, housingId, recipeId, craftingMap, craftingList, housingMap, itemsMap }) => {

        let item: ItemDefinitionMaster
        let housing: Housingitems
        let recipe: Crafting

        if (itemId || housingId) {
          item = itemsMap.get(itemId)
          housing = housingMap.get(housingId)
          recipe = this.nw.recipeForItem(item || housing, craftingList)
        } else if (recipeId) {
          recipe = craftingMap.get(recipeId)
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
        this.isLoading = false
        this.cdRef.markForCheck()
      })

  }

  public ngOnChanges(): void {
    //
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
