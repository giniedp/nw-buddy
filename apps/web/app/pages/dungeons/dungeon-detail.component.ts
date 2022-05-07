import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Gamemodes, Housingitems, ItemDefinitionMaster, Mutationdifficulty, Vitals } from '@nw-data/types'
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
@Component({
  selector: 'nwb-dungeon-detail',
  templateUrl: './dungeon-detail.component.html',
  styleUrls: ['./dungeon-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class DungeonDetailComponent implements OnInit {
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

  public tabs: Array<{
    id: string
    label: string
    vitals$?: Observable<Array<Vitals>>
    query$?: Observable<Array<ItemDefinitionMaster | Housingitems>>
  }>

  public get tabItems() {
    return this.tabs?.find((it) => it.id === this.tab)?.query$
  }

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
          query$: this.ds.dungeonLoot(dungeon).pipe(map((it) => this.filterAndSort(it)))
        })
      } else {
        this.tabs.push({
          id: '',
          label: 'Available Drops',
          query$: this.ds.dungeonMutatedLoot(dungeon).pipe(map((it) => this.filterAndSort(it)))
        })
        this.tabs.push({
          id: 'difficulty',
          label: 'Difficulty Drops',
          query$: this.ds.dungeonMutationLoot(dungeon, difficulty).pipe(map((it) => this.filterAndSort(it)))
        })
      }

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
