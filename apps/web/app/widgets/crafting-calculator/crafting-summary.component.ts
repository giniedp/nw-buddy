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
import { combineLatest, debounceTime, map, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { NwService } from '~/core/nw'
import { NwTradeskillInfo, NwTradeskillService } from '~/core/nw/nw-tradeskill.service'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
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
  quantity: number
}


@Component({
  selector: 'nwb-crafting-summary',
  templateUrl: './crafting-summary.component.html',
  styleUrls: ['./crafting-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingSummaryComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public root: CraftingStepComponent

  public rootPrice: number
  public resourcesPrice: number
  public resourceTable: Array<ResourceRow> = []
  public skillsTable: Array<SkillRow> = []


  public tab: 'resources' | 'skills' = 'resources'

  public get resourceTab() {
    return this.tab === 'resources'
  }
  public get skillsTab() {
    return this.tab === 'skills'
  }

  public trackByIndex: TrackByFunction<any> = (i) => i

  private destroy$ = new Subject()
  private events: Map<string, GameEvent>
  private skills: Map<string, NwTradeskillInfo>

  public constructor(
    private parent: CraftingCalculatorComponent,
    private cdRef: ChangeDetectorRef,
    private nw: NwService,
    private tradeskills: NwTradeskillService,
  ) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      events: this.nw.db.gameEventsMap,
      skills: this.tradeskills.skillsMap,
    })
      .pipe(
        tap(({ events, skills }) => {
          this.events = events
          this.skills = skills
        })
      )
      .pipe(switchMap(() => this.parent.stepChange.pipe(startWith(null))))
      .pipe(debounceTime(100))
      .pipe(switchMap(() => {
        const resources = this.calculateResources()
        const skills = this.calculateSkills()
        return combineLatest({
          resources: of(resources),
          skills: of(skills),
          prices: combineLatest(resources.map((it) => {
            return this.nw.itemPref.observe(it.itemId).pipe(map((data) => {
              return (data.meta?.price || 0) * it.quantity
            }))
          }))
        })
      }))
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ resources, skills, prices }) => {
        this.rootPrice = this.root.quantity * this.nw.itemPref.get(this.root.itemId)?.price || 0
        this.resourcesPrice = prices.reduce((a, b) => a + b, 0)
        this.resourceTable = resources
        this.skillsTable = skills

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

  private walk(node: CraftingStepComponent, fn: (node: CraftingStepComponent) => void) {
    if (node) {
      fn(node)
      node.children?.forEach((it) => this.walk(it, fn))
    }
  }

  private calculateResources(): ResourceRow[] {
    const table = new Map<string, ResourceRow>()
    this.walk(this.root, (node) => {
      if (!node.item || (node.expand && node.steps?.length)) {
        return
      }
      const key = 'ItemID' in node.item ? node.item.ItemID : node.item.HouseItemID
      if (!table.has(key)) {
        table.set(key, {
          item: node.item,
          itemId: key,
          quantity: 0,
        })
      }
      const data = table.get(key)
      data.quantity += node.requiredQuantity
    })
    return Array.from(table.entries()).map(([_, data]) => data)
  }

  private calculateSkills() {
    const table = new Map<string, SkillRow>()
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
      if (!table.has(key)) {
        table.set(key, {
          id: key,
          name: this.skills.get(key)?.Name,
          icon: this.skills.get(key)?.Icon,
          xp: 0,
        })
      }
      const data = table.get(key)
      data.xp += this.nw.recipeProgressionReward(recipe, event) * node.requiredQuantity
      table.set(key, data)
    })
    return Array.from(table.values())
  }
}
