import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnChanges,
  OnDestroy,
  ChangeDetectorRef,
  Input,
  NgZone,
  TrackByFunction,
} from '@angular/core'
import { GameEvent, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { debounceTime, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { NwService } from '~/core/nw'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
import { CraftingStepComponent } from './crafting-step.component'

@Component({
  selector: 'nwb-crafting-summary',
  templateUrl: './crafting-summary.component.html',
  styleUrls: ['./crafting-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingSummaryComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public root: CraftingStepComponent
  public table: Array<{ item: ItemDefinitionMaster | Housingitems; quantity: number }> = []
  public xpTable: Array<{ skill: String; xp: number }> = []

  public trackByIndex: TrackByFunction<any> = (i) => i

  private destroy$ = new Subject()
  private events: Map<string, GameEvent>

  public constructor(
    private parent: CraftingCalculatorComponent,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone,
    private nw: NwService
  ) {
    //
  }

  public ngOnInit(): void {
    this.nw.db.gameEventsMap
      .pipe(
        tap((events) => {
          this.events = events
        })
      )
      .pipe(switchMap(() => this.parent.stepChange.pipe(startWith(null))))
      .pipe(debounceTime(100))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.update())
  }

  public ngOnChanges(): void {
    //
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  private update() {
    this.table = this.calculateItems()
    this.xpTable = this.calculateXp()
    this.cdRef.detectChanges()
  }

  private walk(node: CraftingStepComponent, fn: (node: CraftingStepComponent) => void) {
    if (!node) {
      return
    }
    fn(node)
    node.children?.forEach((it) => this.walk(it, fn))
  }

  private calculateItems() {
    const table = new Map<
      string,
      {
        item: ItemDefinitionMaster | Housingitems
        quantity: number
      }
    >()
    this.walk(this.root, (node) => {
      if (!node.item || (node.expand && node.steps?.length)) {
        return
      }
      const key = 'ItemID' in node.item ? node.item.ItemID : node.item.HouseItemID
      if (!table.has(key)) {
        table.set(key, {
          item: node.item,
          quantity: 0,
        })
      }
      const data = table.get(key)
      data.quantity += node.actualQuantity
    })
    return Array.from(table.entries()).map(([_, data]) => data)
  }

  private calculateXp() {
    const table = new Map<string, number>()
    this.walk(this.root, (node) => {
      if (!node.recipe) {
        return
      }
      const recipe = node.recipe
      const event = this.events.get(recipe.GameEventID)
      if (!event) {
        return
      }
      const key = event.CategoricalProgressionId
      const reward = event.CategoricalProgressionReward || 0
      if (!table.has(key)) {
        table.set(key, 0)
      }
      table.set(key, table.get(key) + reward * node.actualQuantity)
    })
    return Array.from(table.entries()).map(([skill, xp]) => {
      return { skill, xp }
    })
  }
}
