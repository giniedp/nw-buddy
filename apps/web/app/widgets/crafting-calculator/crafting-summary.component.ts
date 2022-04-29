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
import { combineLatest, debounceTime, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { NwService } from '~/core/nw'
import { NwTradeskillInfo, NwTradeskillService } from '~/core/nw/nw-tradeskill.service'
import { TradeskillPreferencesService } from '~/core/preferences/tradeskill-preferences.service'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
import { CraftingStepComponent } from './crafting-step.component'

export interface XpTableRow {
  id: string
  name: string
  icon: string
  xp: number
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
  public table: Array<{ item: ItemDefinitionMaster | Housingitems; quantity: number }> = []
  public xpTable: Array<XpTableRow> = []

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
    private zone: NgZone,
    private nw: NwService,
    private tradeskills: NwTradeskillService,
    private tradeskillPref: TradeskillPreferencesService
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
    const table = new Map<string, XpTableRow>()
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
      data.xp += this.nw.recipeProgressionReward(recipe, event) * node.actualQuantity
      table.set(key, data)
    })
    return Array.from(table.values())
  }
}
