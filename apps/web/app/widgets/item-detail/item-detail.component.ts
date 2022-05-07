import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef, OnChanges } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster, Perks } from '@nw-data/types'
import { BehaviorSubject, combineLatest, map, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "bg-base-300 rounded-md"
  }
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
  public enableNwdbLink: boolean

  @Input()
  public enableMarker: boolean

  @Input()
  public enableTracker: boolean

  @Input()
  public enableRecipe: boolean

  @Input()
  public enableDescription: boolean

  public item: ItemDefinitionMaster
  public recipe: Crafting
  public housing: Housingitems

  public get itemDescription(): string {
    return this.item?.Description || this.housing?.Description
  }
  public itemRarity: number
  public itemRarityName: string
  public perks: Perks[]
  public perkBuckets: Array<{ type: string, chance: number, icon: string }>
  public isLoading = true

  private itemId$ = new BehaviorSubject<string>(null)
  private recipeId$ = new BehaviorSubject<string>(null)

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {

    combineLatest({
      itemId: this.itemId$,

      recipeId: this.recipeId$,

      perksMap: this.nw.db.perksMap,
      itemsMap: this.nw.db.itemsMap,
      housingMap: this.nw.db.housingItemsMap,
      craftingMap: this.nw.db.recipesMap,
      craftingList: this.nw.db.recipes,
    })
      .pipe(map(({ itemId, recipeId, craftingMap, craftingList, housingMap, itemsMap, perksMap }) => {

        let item: ItemDefinitionMaster
        let housing: Housingitems
        let recipe: Crafting

        if (itemId) {
          item = itemsMap.get(itemId)
          housing = housingMap.get(itemId)
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
          perks: item && this.nw.itemPerks(item, perksMap)
        }
      }))
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ recipe, housing, item, perks }) => {
        this.item = item
        this.housing = housing
        this.recipe = recipe
        this.perks = perks
        this.isLoading = false
        this.cdRef.markForCheck()
      })

  }

  public ngOnChanges(ch): void {
    this.cdRef.detectChanges()
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
