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
  Host,
} from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, debounceTime, defer, map, of, ReplaySubject, startWith, switchMap } from 'rxjs'
import { NwService } from '~/core/nw'
import { NwTradeskillService } from '~/core/nw/nw-tradeskill.service'
import { DestroyService, shareReplayRefCount } from '~/core/utils'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
import { CraftingCalculatorService } from './crafting-calculator.service'
import { CraftingStepComponent } from './crafting-step.component'

export interface SkillRow {
  id: string
  name: string
  icon: string
  xp: number
}

export interface ResourceRow {
  item: ItemDefinitionMaster | Housingitems
  itemId: string
  itemPrice: number
  quantity: number
  inStock: number
  finalQuantity: number
  finalPrice: number
  ignored?: boolean
  stocked?: boolean
}

export const enum RowMode {
  None = 0,
  Ignore = 1,
  Stock = 2,
}

@Component({
  selector: 'nwb-crafting-summary',
  templateUrl: './crafting-summary.component.html',
  styleUrls: ['./crafting-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class CraftingSummaryComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public root: CraftingStepComponent

  public tab: 'resources' | 'skills' = 'resources'
  public get resourceTab() {
    return this.tab === 'resources'
  }
  public get skillsTab() {
    return this.tab === 'skills'
  }

  public trackByIndex: TrackByFunction<any> = (i) => i

  public updateTrigger$ = defer(() => this.parent.stepChange.pipe(startWith(null)))
    .pipe(debounceTime(100))
    .pipe(shareReplayRefCount(1))

  public skillsTable$ = defer(() => this.updateTrigger$)
    .pipe(switchMap(() => this.observeSkills()))
    .pipe(shareReplayRefCount(1))

  public resourceTable$ = defer(() => this.updateTrigger$)
    .pipe(switchMap(() => this.observeResources()))
    .pipe(shareReplayRefCount(1))

  public resourcePrice$ = defer(() => this.resourceTable$).pipe(
    map((table) => table.reduce((sum, it) => sum + it.finalPrice, 0))
  )

  private rowMode = new Map<string, RowMode>()
  private rowMode$ = new ReplaySubject<Map<string, RowMode>>(1)

  public constructor(
    private parent: CraftingCalculatorComponent,
    private cdRef: ChangeDetectorRef,
    private nw: NwService,
    private tradeskills: NwTradeskillService,
    private service: CraftingCalculatorService,
    @Host()
    private destroy: DestroyService
  ) {
    //
  }

  public ngOnInit(): void {}

  public ngOnChanges(): void {
    //
  }

  public ngOnDestroy(): void {}

  public toggleIgnore(row: ResourceRow) {
    if (this.getRowMode(row.itemId)) {
      this.rowMode.set(row.itemId, RowMode.None)
    } else {
      this.rowMode.set(row.itemId, RowMode.Ignore)
    }
    this.rowMode$.next(this.rowMode)
  }

  public enableStocked(row: ResourceRow) {
    this.rowMode.set(row.itemId, RowMode.Stock)
    this.rowMode$.next(this.rowMode)
  }

  private getRowMode(id: string) {
    return this.rowMode.get(id) || RowMode.None
  }

  private walk(node: CraftingStepComponent, fn: (node: CraftingStepComponent) => void) {
    if (!node) {
      return
    }
    fn(node)
    if (node.steps?.length && !node.expand) {
      return
    }
    node.children?.forEach((it) => this.walk(it, fn))
  }

  private observeResources() {
    const table = new Map<string, ResourceRow>()
    this.walk(this.root, (node) => {
      if (!node.item || (node.expand && node.steps?.length)) {
        return
      }
      const key = this.nw.itemId(node.item)
      if (!table.has(key)) {
        table.set(key, {
          item: node.item,
          itemId: key,
          quantity: 0,
          inStock: 0,
          itemPrice: 0,
          finalPrice: 0,
          finalQuantity: 0
        })
      }
      const data = table.get(key)
      data.quantity += node.requiredQuantity
    })
    const result = Array.from(table.entries()).map(([_, data]) => data)
    return combineLatest(
      result.map((row) => {
        return combineLatest({
          meta: this.nw.itemPref.observe(row.itemId),
          mode: this.rowMode$.pipe(startWith(this.rowMode)).pipe(map((m) => m.get(row.itemId))),
        }).pipe(
          map(({ meta, mode }) => {
            row.inStock = meta?.meta?.stock || 0
            row.itemPrice = meta?.meta?.price || 0
            switch (mode || RowMode.None) {
              case RowMode.Ignore: {
                row.ignored = true
                row.stocked = false
                row.finalPrice = 0
                row.finalQuantity = 0
                break;
              }
              case RowMode.Stock: {
                row.ignored = row.inStock >= row.quantity
                row.stocked = true
                row.finalQuantity = Math.max(0, row.quantity - row.inStock)
                row.finalPrice = row.finalQuantity * row.itemPrice
                break;
              }
              default: {
                row.ignored = false
                row.stocked = false
                row.finalQuantity = row.quantity
                row.finalPrice = row.quantity * row.itemPrice
                break
              }
            }
            return row
          })
        )
      })
    )
  }

  private observeSkills() {
    return combineLatest({
      events: this.nw.db.gameEventsMap,
      skills: this.tradeskills.skillsMap,
    }).pipe(
      map(({ events, skills }) => {
        const table = new Map<string, SkillRow>()
        this.walk(this.root, (node) => {
          const recipe = this.service.findRecipeForItem(node.item)
          if (!recipe) {
            return
          }
          const event = events.get(recipe.GameEventID)
          if (!event) {
            return
          }
          const key = event.CategoricalProgressionId
          if (!table.has(key)) {
            table.set(key, {
              id: key,
              name: skills.get(key)?.Name,
              icon: skills.get(key)?.Icon,
              xp: 0,
            })
          }
          const data = table.get(key)
          data.xp += this.nw.recipeProgressionReward(recipe, event) * node.requiredQuantity
          table.set(key, data)
        })
        return Array.from(table.values())
      })
    )
  }
}
