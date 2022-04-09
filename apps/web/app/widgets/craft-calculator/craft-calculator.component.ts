import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core'
import { Crafting } from '@nw-data/types'
import { combineLatest, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-craft-calculator',
  templateUrl: './craft-calculator.component.html',
  styleUrls: ['./craft-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftCalculatorComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public itemId: string

  private destroy$ = new Subject()
  private itemId$ = new ReplaySubject<string>(1)

  public constructor(private nw: NwService, private locale: LocaleService) {}

  public ngOnInit(): void {
    combineLatest({
      itemId: this.itemId$,
      items: this.nw.db.itemsMap,
      recipes: this.nw.db.recipesMap,
      locale: this.locale.change
    })
      .pipe(map(({ itemId, items, recipes }) => {
        const item = items.get(itemId)
        const recipe = recipes.get(item.CraftingRecipe)

      }))
      .pipe(takeUntil(this.destroy$))
      .subscribe((item) => {
        // item.CraftingRecipe
      })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.itemId$.next(this.itemId)
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  private craftNode(itemId: string, quantity: number) {
    return combineLatest({
      itemId: this.itemId$,
      items: this.nw.db.itemsMap,
      recipes: this.nw.db.recipesMap,
      locale: this.locale.change
    })
      .pipe(map(({ itemId, items, recipes }) => {
        const item = items.get(itemId)
        const recipe = recipes.get(item.CraftingRecipe)
        // Object.keys(recipe)
        //   .filter((it: keyof Crafting) => it.match(/^Ingredient\d+$/))
        //   .map((key) => {
        //     return {
        //       id: recipe[key],
        //       quantity:
        //     }
        //   })
      }))
  }
}
