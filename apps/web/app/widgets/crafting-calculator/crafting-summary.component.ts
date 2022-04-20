import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef,
  Input,
  AfterViewChecked,
  NgZone,
  TrackByFunction,
} from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { asyncScheduler, debounce, debounceTime, Subject, subscribeOn, takeUntil } from 'rxjs'
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
  public table: Array<{ item: ItemDefinitionMaster, quantity: number }> = []

  public trackByIndex: TrackByFunction<any> = (i) => i

  private destroy$ = new Subject()

  public constructor(private parent: CraftingCalculatorComponent, private cdRef: ChangeDetectorRef, private zone: NgZone) {
    //
  }

  public ngOnInit(): void {
    this.parent.stepChange
      .pipe(debounceTime(1))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTable()
      })
  }

  public ngOnChanges(changes: SimpleChanges): void {

    // sconsole.log(this.root?.children)
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  private updateTable() {
    this.table = this.leaves()
    this.cdRef.markForCheck()
  }

  private walk(node: CraftingStepComponent, fn: (node: CraftingStepComponent) => void) {
    if (!node) {
      return
    }
    fn(node)
    node.children?.forEach((it) => this.walk(it, fn))
  }

  private leaves() {
    const table = new Map<string, {
      item: ItemDefinitionMaster,
      quantity: number
    }>()
    this.walk(this.root, (node) => {
      if (!node.item || node.expand && node.steps?.length) {
        return
      }
      if (!table.has(node.item.ItemID)) {
        table.set(node.item.ItemID, {
          item: node.item,
          quantity: 0
        })
      }
      const data = table.get(node.item.ItemID)
      data.quantity += node.quantity
    })
    return Array.from(table.entries()).map(([_, data]) => data)
  }
}
