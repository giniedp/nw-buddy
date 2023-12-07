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
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import {
  Cursemutations,
  Elementalmutations,
  Gamemodes,
  Housingitems,
  ItemDefinitionMaster,
  Mutationdifficulty,
  Promotionmutations,
} from '@nw-data/generated'
import {
  BehaviorSubject,
  ReplaySubject,
  combineLatest,
  debounceTime,
  defer,
  filter,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'

import { FormsModule } from '@angular/forms'
import {
  NW_MAX_CHARACTER_LEVEL,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemRarityWeight,
  isItemArmor,
  isItemArtifact,
  isItemJewelery,
  isItemNamed,
  isItemWeapon,
  isMasterItem,
} from '@nw-data/common'
import { uniqBy } from 'lodash'
import { DifficultyRank, DungeonPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle, svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { PaginationModule } from '~/ui/pagination'
import { TooltipModule } from '~/ui/tooltip'
import {
  HtmlHeadService,
  eqCaseInsensitive,
  observeQueryParam,
  observeRouteParam,
  selectStream,
  shareReplayRefCount,
} from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { VitalDetailModule } from '~/widgets/data/vital-detail'
import { LootModule } from '~/widgets/loot'
import { injectCurrentMutation } from './current-mutation.service'
import { GameModeDetailStore } from './game-mode-detail.store'
import { MutaCurseTileComponent } from './muta-curse-tile.component'
import { MutaElementTileComponent } from './muta-element-tile.component'
import { MutaPromotionTileComponent } from './muta-promotion-tile.component'

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
  DungeonFirstLight01: 'https://aeternum-map.gg/The%20Savage%20Divide?embed=true',
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
  selector: 'nwb-game-mode-detail',
  templateUrl: './game-mode-detail.component.html',
  styleUrls: ['./game-mode-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    IconsModule,
    ItemDetailModule,
    LayoutModule,
    LootModule,
    NwModule,
    PaginationModule,
    RouterModule,
    //VitalsDetailModule,
    VitalDetailModule,
    MutaElementTileComponent,
    MutaCurseTileComponent,
    MutaPromotionTileComponent,
    TooltipModule,
  ],
  providers: [GameModeDetailStore],
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
export class GameModeDetailComponent implements OnInit {
  public trackById: TrackByFunction<ItemDefinitionMaster | Housingitems> = (i, item) => getItemId(item)
  public trackByIndex = (i: number) => i
  public trackByTabId: TrackByFunction<Tab> = (i, item) => item.id

  protected paramGameMode$ = selectStream(observeRouteParam(this.route, 'id'))
  protected paramMutation$ = selectStream(
    {
      mutations: injectCurrentMutation(),
      gameModeId: this.paramGameMode$,
    },
    ({ mutations, gameModeId }) => mutations?.find((it) => eqCaseInsensitive(it.expedition, gameModeId)),
  )

  protected paramDifficulty$ = selectStream(observeQueryParam(this.route, 'difficulty'), (it) => Number(it) || null)
  protected paramElement$ = selectStream(
    {
      mutation: this.paramMutation$,
      element: observeQueryParam(this.route, 'element'),
    },
    ({ mutation, element }) => element || mutation?.element || null,
  )
  protected paramPromotion$ = selectStream(
    {
      mutation: this.paramMutation$,
      promotion: observeQueryParam(this.route, 'promotion'),
    },
    ({ mutation, promotion }) => promotion || mutation?.promotion || null,
  )
  protected paramCurse$ = selectStream(
    {
      mutation: this.paramMutation$,
      curse: observeQueryParam(this.route, 'curse'),
    },
    ({ mutation, curse }) => curse || mutation?.curse || null,
  )

  protected paramTab$ = selectStream(observeQueryParam(this.route, 'tab'))
  protected paramPlayerLevel$ = selectStream(observeQueryParam(this.route, 'lvl'))
  protected adjustLevel$ = new BehaviorSubject<boolean>(false)
  protected adjustedLevel$ = new BehaviorSubject<number>(NW_MAX_CHARACTER_LEVEL)
  protected isMutated$ = this.paramMutation$.pipe(map((it) => !!it))

  public iconExtern = svgSquareArrowUpRight
  public iconInfo = svgInfoCircle

  public dungeon$ = this.store.gameMode$.pipe(filter((it) => !!it))
  public creaturesBosses$ = this.store.creaturesBosses$
  public creaturesNamed$ = this.store.creaturesNamed$
  public creatures$ = this.store.dingeonCommonCreatures$
  public creatureLevel$ = this.store.enemyLevelOverride$
  public mutaElementId$ = this.store.mutaElement$.pipe(map((it) => it?.ElementalMutationId))

  public difficulties$ = this.store.difficulties$
  public difficulty$ = this.store.mutaDifficulty$
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
      }),
    ),
  }).pipe(
    map(({ item, context }) => {
      return {
        ...context,
        item,
        itemId: getItemId(item),
      }
    }),
  )

  public difficultiesRank$ = defer(() =>
    combineLatest({
      dungeon: this.dungeon$,
      difficulties: this.difficulties$,
    }),
  )
    .pipe(
      switchMap(({ dungeon, difficulties }) =>
        combineLatest(
          difficulties.map((it) => {
            return combineLatest({
              difficulty: of(it),
              rank: this.difficultyRank(dungeon, it),
            })
          }),
        ),
      ),
    )
    .pipe(shareReplayRefCount(1))

  public difficyltyRewards$ = defer(() =>
    combineLatest({
      rank: this.difficultyRank$,
      difficulty: this.difficulty$,
      events: this.db.gameEventsMap,
      items: this.db.itemsMap,
      loot: this.db.lootTablesMap,
    }),
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
    }),
  )

  public difficultyRank$ = defer(() =>
    combineLatest({
      dungeon: this.dungeon$,
      difficulty: this.difficulty$,
    }),
  ).pipe(switchMap(({ dungeon, difficulty }) => this.difficultyRank(dungeon, difficulty)))

  @ViewChild('tplDungeonLoot', { static: true })
  public tplDungeonLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonMutatedLoot', { static: true })
  public tplDungeonMutatedLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonDifficultyLoot', { static: true })
  public tplDungeonDifficultyLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonBosses', { static: true })
  public tplDungeonBosses: TemplateRef<unknown>

  @ViewChild('tplDungeonCreatures', { static: true })
  public tplDungeonCreatures: TemplateRef<unknown>

  @ViewChild('tplDungeonNamed', { static: true })
  public tplDungeonNamed: TemplateRef<unknown>

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
    return this.difficulty ? NW_MAX_CHARACTER_LEVEL : this.dungeon?.RequiredLevel
  }
  public get recommendedLevel() {
    return this.dungeon?.RecommendedLevel
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
  public get teamCapacity() {
    return this.dungeon?.TeamCapacity
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
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private domSanitizer: DomSanitizer,
    protected store: GameModeDetailStore,
    private preferences: DungeonPreferencesService,
    private dialog: Dialog,
    private i18n: TranslateService,
    private head: HtmlHeadService,
    private platform: PlatformService,
  ) {}

  public ngOnInit(): void {
    const playerLevel$ = combineLatest({
      enabled: this.adjustLevel$,
      level: this.adjustedLevel$,
      queryLevel: this.paramPlayerLevel$,
    }).pipe(
      debounceTime(300),
      map(({ enabled, level, queryLevel }) => {
        return (enabled ? level : Number(queryLevel)) || null
      }),
    )

    this.store.patchState(
      combineLatest({
        playerLevel: playerLevel$,
        gameModeId: this.paramGameMode$,
        mutationDifficultyId: this.paramDifficulty$,
        mutationElementId: this.paramElement$,
        mutationPromotionId: this.paramPromotion$,
        mutationCurseId: this.paramCurse$,
      }),
    )

    combineLatest({
      dungeon: this.dungeon$,
      difficulty: this.difficulty$,
    })
      .pipe(takeUntil(this.store.destroy$))
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
        if (dungeon.IsRaidTrial || dungeon.IsSoloTrial) {
          this.tabs.push({
            id: 'creatures',
            label: 'Creatures',
            tpl: this.tplDungeonCreatures,
          })
        }
        this.tabs.push({
          id: 'named',
          label: 'Named',
          tpl: this.tplDungeonNamed,
        })
        this.tabs.push({
          id: 'bosses',
          label: 'Bosses',
          tpl: this.tplDungeonBosses,
        })

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

    this.paramTab$.pipe(takeUntil(this.store.destroy$)).subscribe((tab) => {
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
      }),
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
    return uniqBy(items, (it) => getItemId(it))
      .filter((it) => getItemRarity(it) != 'common')
      .sort((nodeA, nodeB) => {
        const a = nodeA
        const b = nodeB
        const isGearA = isMasterItem(a) && (isItemArmor(a) || isItemJewelery(a) || isItemWeapon(a))
        const isGearB = isMasterItem(b) && (isItemArmor(b) || isItemJewelery(b) || isItemWeapon(b))
        if (isGearA !== isGearB) {
          return isGearA ? -1 : 1
        }
        const isNamedA = isMasterItem(a) && (isItemNamed(a) || isItemArtifact(a))
        const isNamedB = isMasterItem(b) && (isItemNamed(b) || isItemArtifact(b))
        if (isNamedA !== isNamedB) {
          return isNamedA ? -1 : 1
        }
        const rarrityA = getItemRarityWeight(a)
        const rarrityB = getItemRarityWeight(b)
        if (rarrityA !== rarrityB) {
          return rarrityA >= rarrityB ? -1 : 1
        }
        return getItemId(a).localeCompare(getItemId(b))
      })
  }

  protected onMutaElementSelected(value: Elementalmutations) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        element: value?.CategoryWildcard || null,
      },
      queryParamsHandling: 'merge',
    })
  }

  protected onMutaPromotionSelected(value: Promotionmutations) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        promotion: value?.PromotionMutationId || null,
      },
      queryParamsHandling: 'merge',
    })
  }

  protected onMutaCurseSelected(value: Cursemutations) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        curse: value?.CurseMutationId || null,
      },
      queryParamsHandling: 'merge',
    })
  }
}
