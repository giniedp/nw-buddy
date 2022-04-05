import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster, Perks } from '@nw-data/types'
import { groupBy } from 'lodash'
import { combineLatest, map, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-trophies',
  templateUrl: './trophies.component.html',
  styleUrls: ['./trophies.component.scss'],
})
export class TrophiesComponent implements OnInit, OnDestroy {
  public groups: Array<{
    tags: string
    items: Array<{
      housing: Housingitems
      ingredient: ItemDefinitionMaster
      recipe: Crafting
    }>
  }>

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    combineLatest([this.nw.db.housingItems, this.nw.db.recipes, this.nw.db.itemsMap])
      .pipe(
        map(([housing, recipes, items]) => {
          return this.findSets(housing, recipes, items)
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((groups) => {
        this.groups = groups
        console.log(groups)
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public iconPath(path: string) {
    return this.nw.iconPath(path)
  }

  public itemName(item: Housingitems) {
    return this.nw.translate(item.Name)
  }

  public itemRarity(item: Housingitems | ItemDefinitionMaster) {
    return this.nw.itemRarity(item as any)
  }

  private findSets(housing: Housingitems[], recipes: Crafting[], materItems: Map<string, ItemDefinitionMaster>) {
    housing = housing.filter((it) => it.UIHousingCategory === 'Trophies')

    return Object.entries(groupByTags(housing)).map(([tags, items]) => {
      return {
        tags: tags,
        // icon: perk?.IconPath,
        items: items
          .sort((a, b) => (a.Tier < b.Tier ? -1 : 1))
          .map((item) => {
            const recipe = recipes.find((it) => item.HouseItemID === it.ItemID)
            let ingredient = materItems.get(recipe.Ingredient4)
            if (!ingredient) {
              ingredient = recipe as any
            }
            return {
              housing: item,
              recipe,
              ingredient,
            }
          }),
      }
    })
  }
}

function groupByTags(items: Housingitems[]) {
  return groupBy(items, (it) => it.HousingTags)
}
