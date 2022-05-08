import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, TemplateRef, ViewChild, TrackByFunction } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Gamemodes, Housingitems, ItemDefinitionMaster, Mutationdifficulty, Vitals } from '@nw-data/types'
import { pick } from 'lodash'
import { combineLatest, defer, map, Observable, switchMap, takeUntil, tap } from 'rxjs'
import { NwService } from '~/core/nw'
import { DestroyService, observeQueryParam, observeRouteParam, shareReplayRefCount } from '~/core/utils'
import { DungeonsService } from './dungeons.service'

const DIFFICULTY_TIER_NAME = {
  1: 'Normal',
  2: 'Intermediate',
  3: 'Hard',
  4: 'Elite'
}
export interface Tab {
  id: string
  label: string
  tpl: TemplateRef<unknown>
}
@Component({
  selector: 'nwb-dungeon-detail',
  templateUrl: './dungeon-detail.component.html',
  styleUrls: ['./dungeon-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class DungeonDetailComponent implements OnInit {

  public trackById: TrackByFunction<ItemDefinitionMaster | Housingitems> = (i, item) => this.nw.itemId(item)
  public trackByIndex: TrackByFunction<any> = (i, item) => i
  public trackByTabId: TrackByFunction<Tab> = (i, item) => item.id

  public dungeonId$ = defer(() => observeRouteParam(this.route, 'id'))
  public mutationParam$ = defer(() => observeRouteParam(this.route, 'mutation'))
    .pipe(map((it) => Number(it) || undefined))
  public tabParam$ = defer(() => observeRouteParam(this.route, 'tab'))

  public dungeon$ = defer(() => this.dungeonId$)
    .pipe(switchMap((id) => this.ds.dungeon(id)))
    .pipe(shareReplayRefCount(1))

  public bosses$ = defer(() => this.dungeon$)
    .pipe(switchMap((it) => this.ds.dungeonBosses(it)))
    .pipe(shareReplayRefCount(1))

  public difficulties$ = defer(() => this.dungeon$)
    .pipe(switchMap((it) => this.ds.dungeonDifficulties(it)))
    .pipe(shareReplayRefCount(1))

  public difficulty$ = defer(() =>
    combineLatest({
      difficulties: this.difficulties$,
      difficulty: this.mutationParam$,
    })
  )
    .pipe(map(({ difficulties, difficulty }) => this.ds.dungeonDifficulty(difficulties, Number(difficulty))))
    .pipe(shareReplayRefCount(1))

  public expeditionItems$ = defer(() => this.dungeon$)
    .pipe(switchMap((dungeon) => this.ds.dungeonPossibleDrops(dungeon)))
    .pipe(map((items) => this.filterAndSort(items)))

  public dungeonLoot$ = defer(() => this.dungeon$)
    .pipe(switchMap((dungeon) => this.ds.dungeonLoot(dungeon)))
    .pipe(map((it) => this.filterAndSort(it)))

  public dungeonMutatedLoot$ = defer(() => this.dungeon$)
    .pipe(switchMap((dungeon) => this.ds.dungeonMutatedLoot(dungeon)))
    .pipe(map((it) => this.filterAndSort(it)))

  public dungeonDifficultyLoot$ = defer(() => combineLatest([this.dungeon$, this.difficulty$]))
    .pipe(switchMap(([dungeon, difficulty]) => this.ds.dungeonMutationLoot(dungeon, difficulty)))
    .pipe(map((it) => this.filterAndSort(it)))

  public difficyltyRewards$ = defer(() => combineLatest({
    difficulty: this.difficulty$,
    events: this.nw.db.gameEventsMap,
    items: this.nw.db.itemsMap
  }))
    .pipe(map(({ difficulty, events, items }) => {
      return [
        [difficulty.CompletionEvent1, 'ui_dungeon_mutator_bronze'],
        [difficulty.CompletionEvent2, 'ui_dungeon_mutator_silver'],
        [difficulty.CompletionEvent3, 'ui_dungeon_mutator_gold']
      ].map(([it, rank], i) => {
        const event = events.get(it)
        const item = items.get(event.ItemReward as string)
        return {
          RankName: rank,
          ItemID: item.ItemID,
          ItemName: item.Name,
          IconPath: item.IconPath,
          Quantity: event.ItemRewardQty
        }
      })
    }))

  @ViewChild('tplDungeonLoot')
  public tplDungeonLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonMutatedLoot')
  public tplDungeonMutatedLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonDifficultyLoot')
  public tplDungeonDifficultyLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonBosses')
  public tplDungeonBosses: TemplateRef<unknown>

  @ViewChild('tplRewards')
  public tplRewards: TemplateRef<unknown>

  public dungeon: Gamemodes
  public difficulty: Mutationdifficulty
  public tab: string = ''
  public get title() {
    return this.dungeon?.DisplayName
  }
  public get description() {
    return this.dungeon?.Description
  }
  public get icon() {
    return this.dungeon?.IconPath
  }
  public get backgroundImage() {
    return this.dungeon?.BackgroundImagePath
  }
  public get requiredLevel() {
    return this.dungeon?.RequiredLevel
  }
  public get requiredGearScore() {
    return this.difficulty?.RecommendedGearScore
  }
  public get requirementText() {
    return this.dungeon?.RequirementText
  }
  public get groupSize() {
    return this.dungeon?.MinGroupSize
  }
  public get isMutable() {
    return this.dungeon?.IsMutable
  }
  public get difficultyLevel() {
    return this.difficulty?.MutationDifficulty
  }

  public tabs: Array<Tab>

  public constructor(
    private nw: NwService,
    private ds: DungeonsService,
    private route: ActivatedRoute,
    private destroy: DestroyService,
    private cdRef: ChangeDetectorRef
  ) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      dungeon: this.dungeon$,
      difficulty: this.difficulty$,
    }).pipe(takeUntil(this.destroy.$)).subscribe(({ dungeon, difficulty }) => {

      this.dungeon = dungeon
      this.difficulty = difficulty
      this.tabs = []

      if (!difficulty) {
        this.tabs.push({
          id: '',
          label: 'Available Drops',
          tpl: this.tplDungeonLoot
        })
      } else {
        this.tabs.push({
          id: '',
          label: 'Available Drops',
          tpl: this.tplDungeonMutatedLoot
        })
        this.tabs.push({
          id: 'difficulty',
          label: 'Difficulty Drops',
          tpl: this.tplDungeonDifficultyLoot
        })
      }
      this.tabs.push({
        id: 'bosses',
        label: 'Bosses',
        tpl: this.tplDungeonBosses
      })
      this.cdRef.markForCheck()
    })

    this.tabParam$.pipe(takeUntil(this.destroy.$)).subscribe((tab) => {
      this.tab = tab || ''
      this.cdRef.markForCheck()
    })
  }

  public itemId(item: ItemDefinitionMaster | Housingitems) {
    return this.nw.itemId(item)
  }

  public difficultyTier(item: Mutationdifficulty) {
    return DIFFICULTY_TIER_NAME[item.DifficultyTier] ?? `${item.DifficultyTier}`
  }

  private filterAndSort(items: Array<ItemDefinitionMaster | Housingitems>) {
    return items
    .filter((it) => this.nw.itemRarity(it) >= 1)
    .sort((a, b) => this.nw.itemId(a).localeCompare(this.nw.itemId(b)))
    .sort((a, b) => this.nw.itemRarity(b) - this.nw.itemRarity(a))
  }
}
