import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef, OnChanges } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
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
      items: this.nw.db.itemsMap,
      housing: this.nw.db.housingItemsMap,
      crafting: this.nw.db.recipesMap,
    })
      .pipe(map((data) => {

        const recipe = data.crafting.get(data.input.recipeId)
        const itemId = this.nw.itemIdFromRecipe(recipe)
        const housing = data.housing.get(data.input.housingId || itemId)
        const item = data.items.get(data.input.itemId || itemId)
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

        // this.perks = [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5]
        //   .map((it) => perks.get(it))
        //   .filter((it) => !!it)
        //   .map((it) => {
        //     return {
        //       id: it.PerkID,
        //       name: this.nw.translate(it.DisplayName),
        //       description: this.nw.translate(it.Description),
        //       icon: this.nw.iconPath(it.IconPath)
        //     }
        //   })
        // this.perkBuckets = [item.PerkBucket1, item.PerkBucket2, item.PerkBucket3, item.PerkBucket4, item.PerkBucket5]
        //   .map((it) => buckets.get(it))
        //   .filter((it) => !!it)
        //   .map((it) => {
        //     return {
        //       type: it.PerkType,
        //       chance: it.PerkChance,
        //       icon: ''
        //     }
        //   })

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
