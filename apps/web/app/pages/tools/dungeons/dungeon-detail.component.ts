import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  TrackByFunction,
  ViewChild,
} from '@angular/core'
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Gamemodes, Housingitems, ItemDefinitionMaster, Mutationdifficulty } from '@nw-data/types'
import { ReplaySubject, combineLatest, defer, map, of, switchMap, takeUntil } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'

import {
  getItemIconPath,
  getItemId,
  getItemRarity,
  isItemArmor,
  isItemJewelery,
  isItemNamed,
  isItemWeapon,
  isMasterItem,
} from '~/nw/utils'
import { DifficultyRank, DungeonPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { PaginationModule } from '~/ui/pagination'
import { DestroyService, HtmlHeadService, observeRouteParam, shareReplayRefCount } from '~/utils'
import { PlatformService } from '~/utils/platform.service'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { LootModule } from '~/widgets/loot'
import { VitalsDetailModule } from '~/widgets/vitals-detail'
import { DungeonDetailStore } from './dungeon-detail.store'

const DIFFICULTY_TIER_NAME = {
  1: 'Normal',
  2: 'Intermediate',
  3: 'Hard',
  4: 'Elite',
}
const MAP_EMBED_URLS = {
  DungeonAmrine: 'https://aeternum-map.gg/Amrine%20Excavation?embed=true',
  DungeonBrimstoneSands00: 'https://aeternum-map.gg/The%20Ennead?embed=true',
  DungeonCutlassKeys00: 'https://aeternum-map.gg/Barnacles%20&%20Black%20Powder?embed=true',
  DungeonEbonscale00: 'https://aeternum-map.gg/?bounds=4480,4096,5088,4640&embed=true',
  DungeonEdengrove00: 'https://aeternum-map.gg/Garden%20of%20Genesis?embed=true',
  DungeonGreatCleave01: 'https://aeternum-map.gg/Empyrean%20Forge?embed=true',
  DungeonReekwater00: 'https://aeternum-map.gg/Lazarus%20Instrumentality?embed=true',
  DungeonRestlessShores01: 'https://aeternum-map.gg/The%20Depths?embed=true',
  DungeonShatteredObelisk: 'https://aeternum-map.gg/Starstone%20Barrows?embed=true',
  DungeonShatterMtn00: "https://aeternum-map.gg/Tempest's%20Heart?embed=true",
  QuestApophis: null,
}

function withoutEmbedAttr(url: string) {
  const result = new URL(url)
  result.searchParams.delete('embed')
  return result.toString()
}
export interface Tab {
  id: string
  label: string
  tpl: TemplateRef<unknown>
  externUrl?: SafeUrl
}
@Component({
  standalone: true,
  selector: 'nwb-dungeon-detail',
  templateUrl: './dungeon-detail.component.html',
  styleUrls: ['./dungeon-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ItemDetailModule,
    VitalsDetailModule,
    LootModule,
    LayoutModule,
    PaginationModule,
    IconsModule,
  ],
  providers: [DestroyService, DungeonDetailStore],
  host: {
    class: 'layout-col xl:flex-row',
  },
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(5, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
    trigger('fade', [transition(':enter', [style({ opacity: 0 }), animate('0.150s ease-out', style({ opacity: 1 }))])]),
  ],
})
export class DungeonDetailComponent implements OnInit {
  public trackById: TrackByFunction<ItemDefinitionMaster | Housingitems> = (i, item) => getItemId(item)
  public trackByIndex = (i: number) => i
  public trackByTabId: TrackByFunction<Tab> = (i, item) => item.id

  public dungeonId$ = defer(() => observeRouteParam(this.route, 'id'))
  public mutationParam$ = defer(() => observeRouteParam(this.route, 'mutation')).pipe(
    map((it) => Number(it) || undefined)
  )
  public tabParam$ = defer(() => observeRouteParam(this.route, 'tab'))
  public iconExtern = svgSquareArrowUpRight
  public dungeon$ = this.store.dungeon$
  public bosses$ = this.store.bosses$
  public difficulties$ = this.store.difficulties$
  public difficulty$ = this.store.difficulty$.pipe(shareReplayRefCount(1))
  public dungeonLoot$ = this.store.lootNormalMode$.pipe(map((it) => this.filterAndSort(it)))
  public dungeonMutatedLoot$ = this.store.lootMutatedMode.pipe(map((it) => this.filterAndSort(it)))
  public dungeonDifficultyLoot$ = this.store.lootDifficulty$.pipe(map((it) => this.filterAndSort(it)))

  public dungeonLootTags$ = this.store.lootTagsNormalMode$
  public dungeonMutatedLootTags$ = this.store.lootTagsMutatedMode$
  public dungeonDifficultyLootTags$ = this.store.lootTagsDifficulty$

  public expeditionItems$ = this.store.possibleItemDrops$
  public explainItem$ = new ReplaySubject<ItemDefinitionMaster | Housingitems>(1)
  public explainMode$ = new ReplaySubject<'normal' | 'mutated' | 'difficulty'>(1)
  public explainVm$ = combineLatest({
    item: this.explainItem$,
    context: this.explainMode$.pipe(
      switchMap((mode) => {
        if (mode === 'difficulty') {
          return this.store.lootTagsDifficulty$
        }
        if (mode === 'mutated') {
          return this.store.lootTagsMutatedMode$
        }
        return this.store.lootTagsNormalMode$
      })
    ),
  }).pipe(
    map(({ item, context }) => {
      return {
        ...context,
        item,
        itemId: getItemId(item),
      }
    })
  )

  public difficultiesRank$ = defer(() =>
    combineLatest({
      dungeon: this.dungeon$,
      difficulties: this.difficulties$,
    })
  )
    .pipe(
      switchMap(({ dungeon, difficulties }) =>
        combineLatest(
          difficulties.map((it) => {
            return combineLatest({
              difficulty: of(it),
              rank: this.difficultyRank(dungeon, it),
            })
          })
        )
      )
    )
    .pipe(shareReplayRefCount(1))

  public difficyltyRewards$ = defer(() =>
    combineLatest({
      rank: this.difficultyRank$,
      difficulty: this.difficulty$,
      events: this.db.gameEventsMap,
      items: this.db.itemsMap,
      loot: this.db.lootTablesMap,
    })
  ).pipe(
    map(({ rank, difficulty, events, items, loot }) => {
      if (!difficulty) {
        return []
      }

      return [
        { eventId: difficulty.CompletionEvent1, rankPos: 1, rankId: 'bronze' as DifficultyRank },
        { eventId: difficulty.CompletionEvent2, rankPos: 2, rankId: 'silver' as DifficultyRank },
        { eventId: difficulty.CompletionEvent3, rankPos: 3, rankId: 'gold' as DifficultyRank },
      ]
        .map(({ eventId, rankPos, rankId }, i) => {
          // TODO: cleanup
          const event = events.get(eventId)
          const bucket = loot.get(`Loot_MutDiff${difficulty.MutationDifficulty}T${rankPos}`)
          const bucketItem = bucket.Items?.[0]
          const itemId = bucketItem?.ItemID
          const item = items.get(itemId)

          if (!item) {
            return null
          }
          return {
            RankName: `ui_dungeon_mutator_${rankId}`,
            ItemID: item.ItemID,
            ItemName: item.Name,
            IconPath: getItemIconPath(item),
            Quantity: bucketItem?.Qty || '?',
            Completed: rankId == rank,
            toggle: () => {
              if (rankId == rank) {
                this.updateRank(null)
              } else {
                this.updateRank(rankId)
              }
            },
          }
        })
        .filter((it) => !!it)
    })
  )

  public difficultyRank$ = defer(() =>
    combineLatest({
      dungeon: this.dungeon$,
      difficulty: this.difficulty$,
    })
  ).pipe(switchMap(({ dungeon, difficulty }) => this.difficultyRank(dungeon, difficulty)))

  @ViewChild('tplDungeonLoot', { static: true })
  public tplDungeonLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonMutatedLoot', { static: true })
  public tplDungeonMutatedLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonDifficultyLoot', { static: true })
  public tplDungeonDifficultyLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonBosses', { static: true })
  public tplDungeonBosses: TemplateRef<unknown>

  @ViewChild('tplRewards', { static: true })
  public tplRewards: TemplateRef<unknown>

  @ViewChild('tplDungeonMap', { static: true })
  public tplDungeonMap: TemplateRef<unknown>

  @ViewChild('tplExplain', { static: true })
  public tplExplain: TemplateRef<unknown>

  public dungeon: Gamemodes
  public difficulty: Mutationdifficulty
  public tab: string = ''
  public mapEmbed: SafeResourceUrl

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
    private db: NwDbService,
    private route: ActivatedRoute,
    private destroy: DestroyService,
    private cdRef: ChangeDetectorRef,
    private domSanitizer: DomSanitizer,
    private store: DungeonDetailStore,
    private preferences: DungeonPreferencesService,
    private dialog: Dialog,
    private i18n: TranslateService,
    private head: HtmlHeadService,
    private platform: PlatformService
  ) {}

  public ngOnInit(): void {
    const dungeon$ = this.db.gameMode(this.dungeonId$)
    const difficulty$ = combineLatest({
      difficulty: this.mutationParam$,
      difficulties: this.db.mutatorDifficulties,
    }).pipe(
      map(({ difficulties, difficulty }) => {
        return difficulties?.find((it) => it.MutationDifficulty === Number(difficulty))
      })
    )
    const input$ = combineLatest({
      dungeon: dungeon$,
      difficulty: difficulty$,
    })
    this.store.update(input$)

    combineLatest({
      dungeon: this.dungeon$,
      difficulty: this.difficulty$,
    })
      .pipe(takeUntil(this.destroy.$))
      .subscribe(({ dungeon, difficulty }) => {
        this.dungeon = dungeon
        this.difficulty = difficulty
        this.tabs = []

        if (!difficulty) {
          this.tabs.push({
            id: '',
            label: 'Available Drops',
            tpl: this.tplDungeonLoot,
          })
        } else {
          this.tabs.push({
            id: '',
            label: 'Available Drops',
            tpl: this.tplDungeonMutatedLoot,
          })
          this.tabs.push({
            id: 'difficulty',
            label: 'Difficulty Drops',
            tpl: this.tplDungeonDifficultyLoot,
          })
        }
        this.tabs.push({
          id: 'bosses',
          label: 'Bosses',
          tpl: this.tplDungeonBosses,
        })
        //console.log(dungeon.GameModeId)
        const mapUrl = MAP_EMBED_URLS[dungeon.GameModeId]
        this.mapEmbed = mapUrl ? this.domSanitizer.bypassSecurityTrustResourceUrl(mapUrl) : null
        if (this.mapEmbed) {
          const tab: Tab = {
            id: 'map',
            label: 'Map',
            tpl: this.tplDungeonMap,
          }
          if (this.platform.isOverwolf) {
            tab.externUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(withoutEmbedAttr(mapUrl))
          }
          this.tabs.push(tab)
        }

        this.head.updateMetadata({
          title: this.i18n.get(dungeon.DisplayName),
          description: this.i18n.get(dungeon.Description),
          image: dungeon.BackgroundImagePath,
        })
        this.cdRef.detectChanges()
      })

    this.tabParam$.pipe(takeUntil(this.destroy.$)).subscribe((tab) => {
      this.tab = tab || ''
      this.cdRef.detectChanges()
    })
  }

  public itemId(item: ItemDefinitionMaster | Housingitems) {
    return getItemId(item)
  }

  public difficultyTier(item: Mutationdifficulty) {
    return DIFFICULTY_TIER_NAME[item.DifficultyTier] ?? `${item.DifficultyTier}`
  }

  public difficultyRank(dungeon: Gamemodes, difficulty: Mutationdifficulty) {
    if (!dungeon || !difficulty) {
      return of(null)
    }
    return this.preferences.observeRank(dungeon.GameModeId, difficulty.MutationDifficulty)
  }

  public difficultyRankIcon(dungeon: Gamemodes, difficulty: Mutationdifficulty) {
    if (!dungeon || !difficulty) {
      return of(null)
    }
    return this.difficultiesRank$.pipe(
      map((ranks) => {
        const index = ranks.findIndex((it) => it.difficulty.MutationDifficulty === difficulty.MutationDifficulty)
        const rank = ranks[index]?.rank
        if (rank) {
          return this.rankIcon(rank)
        }
        if (ranks.some((it, i) => it.rank && i > index)) {
          return 'assets/icons/expedition/icon_check_glowing.png' // unlocked and passed
        }
        if (ranks[index - 1]?.rank || index === 0) {
          return null // unlocked
        }
        return `assets/icons/expedition/icon_lock_small.png`
      })
    )
  }

  public rankIcon(rank: DifficultyRank) {
    if (rank) {
      return `assets/icons/expedition/mutator_rank_${rank}_sm.png`
    }
    return `assets/icons/expedition/icon_lock_small.png`
  }

  public updateRankToGold() {
    this.updateRank('gold')
  }

  public updateRankToSilver() {
    this.updateRank('silver')
  }

  public updateRankToBronze() {
    this.updateRank('bronze')
  }

  public updateRank(value: DifficultyRank) {
    if (this.dungeon && this.difficulty) {
      this.preferences.updateRank(this.dungeon.GameModeId, this.difficulty.MutationDifficulty, value)
      this.cdRef.markForCheck()
    }
  }

  public explainItemDrop(item: ItemDefinitionMaster | Housingitems, mode: 'normal' | 'mutated' | 'difficulty') {
    this.explainItem$.next(item)
    this.explainMode$.next(mode)
  }

  public openExplainDialog() {
    this.dialog.open(this.tplExplain, {
      maxWidth: 1600,
      maxHeight: 1200,
      panelClass: ['w-full', 'h-full', 'bg-base-300'],
    })
  }

  public closeDialog() {
    this.dialog.closeAll()
  }

  private filterAndSort(items: Array<ItemDefinitionMaster | Housingitems>) {
    return items
      .filter((it) => getItemRarity(it) >= 1)
      .sort((nodeA, nodeB) => {
        const a = nodeA
        const b = nodeB
        const isGearA = isMasterItem(a) && (isItemArmor(a) || isItemJewelery(a) || isItemWeapon(a))
        const isGearB = isMasterItem(b) && (isItemArmor(b) || isItemJewelery(b) || isItemWeapon(b))
        if (isGearA !== isGearB) {
          return isGearA ? -1 : 1
        }
        const isNamedA = isMasterItem(a) && isItemNamed(a)
        const isNamedB = isMasterItem(b) && isItemNamed(b)
        if (isNamedA !== isNamedB) {
          return isNamedA ? -1 : 1
        }
        const rarrityA = getItemRarity(a)
        const rarrityB = getItemRarity(b)
        if (rarrityA !== rarrityB) {
          return rarrityA >= rarrityB ? -1 : 1
        }
        return getItemId(a).localeCompare(getItemId(b))
      })
  }
}
