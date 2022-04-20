import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core'
import { Crafting, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, defer, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

@Component({
  selector: 'nwb-crafting-calculator',
  templateUrl: './crafting-calculator.component.html',
  styleUrls: ['./crafting-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingCalculatorComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public itemId: string

  @Input()
  public quantity: number = 1

  @Input()
  public readonly: boolean = false

  public item: ItemDefinitionMaster
  public recipe: Crafting

  public stepChange = defer(() => this.stepChange$)

  private destroy$ = new Subject()
  private itemId$ = new ReplaySubject<string>(1)
  private stepChange$ = new Subject()

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    combineLatest({
      itemId: this.itemId$,
      items: this.nw.db.itemsMap,
      recipes: this.nw.db.recipes,
    })
      .pipe(
        map(({ itemId, items, recipes }) => {
          const item = items.get(itemId)
          return {
            item,
            recipe: item && this.nw.findRecipeForItem(item, recipes),
          }
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.item = data.item
        this.recipe = data.recipe
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.itemId$.next(this.itemId)
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public reportChange() {
    this.stepChange$.next(null)
  }
}
