import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  TrackByFunction,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import {
  CurseMutationStaticData,
  ElementalMutationStaticData,
  GameModeData,
  HouseItems,
  MasterItemDefinitions,
  MutationDifficultyStaticData,
  PromotionMutationStaticData,
  VitalsBaseData,
} from '@nw-data/generated'
import { of } from 'rxjs'
import { CharacterStore, injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'

import { FormsModule } from '@angular/forms'
import { NW_MAX_CHARACTER_LEVEL, getItemId } from '@nw-data/common'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle, svgLocationCrosshairs, svgSquareArrowUpRight, svgThumbtack } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { PaginationModule } from '~/ui/pagination'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, eqCaseInsensitive, injectParam, injectQueryParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { VitalDetailModule } from '~/widgets/data/vital-detail'
import { LootModule } from '~/widgets/loot'
import { injectCurrentMutation } from './current-mutation.service'
import { GameModeDetailLootComponent } from './game-mode-detail-loot.component'
import { GameModeDetailMapComponent } from './game-mode-detail-map.component'
import { GameModeDetailVitalsComponent } from './game-mode-detail-vitals.component'
import { GameModeStore } from './game-mode.store'
import { MutaCurseTileComponent } from './muta-curse-tile.component'
import { MutaElementTileComponent } from './muta-element-tile.component'
import { MutaPromotionTileComponent } from './muta-promotion-tile.component'

const DIFFICULTY_TIER_NAME = {
  1: 'Normal',
  2: 'Intermediate',
  3: 'Hard',
  4: 'Elite',
}

export type GameModeTabId = '' | 'loot' | 'difficulty' | 'creatures' | 'named' | 'bosses'
export interface Tab {
  id: GameModeTabId
  label: string
  active: boolean
  loot: Array<MasterItemDefinitions | HouseItems>
  vitals: Array<VitalsBaseData>
  count: number
}

@Component({
  selector: 'nwb-game-mode-detail',
  templateUrl: './game-mode-detail.component.html',
  styleUrl: './game-mode-detail.component.css',
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
    VitalDetailModule,
    MutaElementTileComponent,
    MutaCurseTileComponent,
    MutaPromotionTileComponent,
    TooltipModule,
    GameModeDetailMapComponent,
    GameModeDetailLootComponent,
    GameModeDetailVitalsComponent,
  ],
  providers: [GameModeStore],
  host: {
    class: 'ion-page',
  },
})
export class GameModeDetailComponent {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  // protected store = inject(GameModeDetailStore)
  protected store = inject(GameModeStore)
  private character = inject(CharacterStore)
  private i18n = inject(TranslateService)
  private head = inject(HtmlHeadService)

  private db = injectNwData()
  public trackById: TrackByFunction<MasterItemDefinitions | HouseItems> = (i, item) => getItemId(item)
  public trackByIndex = (i: number) => i
  public trackByTabId: TrackByFunction<Tab> = (i, item) => item.id

  protected paramGameMode = injectParam('id')
  protected paramCurse = injectQueryParam('curse')
  protected paramElement = injectQueryParam('element')
  protected paramPromotion = injectQueryParam('promotion')
  protected paramDifficulty = injectQueryParam('difficulty')
  protected paramTab = injectQueryParam('tab', { transform: (it) => it || '' })
  protected paramTabVitals = injectQueryParam('tabv')

  protected currentMutations = injectCurrentMutation()
  protected activeMutation = computed(() => {
    return this.currentMutations()?.find((it) => {
      return eqCaseInsensitive(it.expedition, this.paramGameMode())
    })
  })

  protected mapPinned = signal(false)
  protected iconTarget = svgLocationCrosshairs
  protected iconPin = svgThumbtack
  protected vitalTargetHover = signal<VitalsBaseData>(null)
  protected vitalTargetClick = signal<VitalsBaseData>(null)

  public iconExtern = svgSquareArrowUpRight
  public iconInfo = svgInfoCircle

  public dungeon = this.store.gameMode
  public isMutable = this.store.isMutable

  public creaturesBosses = this.store.creaturesBosses
  public creaturesNamed = this.store.creaturesNamed
  public creaturesCommon = this.store.creaturesCommon

  public difficulty = this.store.mutaDifficulty
  public difficultyLevel = this.store.mutaDifficultyLevel
  public difficulties = this.store.mutaDifficulties

  public title = computed(() => this.dungeon()?.DisplayName)
  public description = computed(() => this.dungeon()?.Description)
  public icon = computed(() => this.dungeon()?.IconPath)
  public backgroundImage = computed(() => this.dungeon()?.BackgroundImagePath)
  public requiredLevel = computed(() => {
    return this.difficultyLevel() ? NW_MAX_CHARACTER_LEVEL : this.dungeon()?.RequiredLevel
  })
  public recommendedLevel = computed(() => this.dungeon()?.RecommendedLevel)
  public requiredGearScore = computed(() => this.difficulty()?.RecommendedGearScore)
  public recommendedGsMin = computed(() => this.dungeon()?.GearScoreRecommendedValueMin)
  public recommendedGsMax = computed(() => this.dungeon()?.GearScoreRecommendedValueMax)
  public requirementText = computed(() => this.dungeon()?.RequirementText)
  public groupSizeMin = computed(() => this.dungeon()?.MinGroupSize)
  public groupSizeMax = computed(() => this.dungeon()?.TeamCapacity)
  public lootGsRange = computed(() => this.difficulty()?.LootGSRangeOverride || this.dungeon()?.LootGSRangeOverride)

  public tplRewards = viewChild('tplRewards', { read: TemplateRef })
  public tplExplain = viewChild('tplExplain', { read: TemplateRef })

  public activeTab = computed(() => this.tabs().find((it) => it.active))
  public tabs = computed(() => {
    const difficulty = this.store.mutaDifficulty()
    const rewards = this.store.completionRewards()
    const lootNormal = this.store.lootNormal()
    const lootMutated = this.store.lootMutated()
    const lootDifficulty = this.store.lootDifficulty()
    const vitalsCommon = this.store.creaturesCommon()
    const vitalsNamed = this.store.creaturesNamed()
    const vitalsBosses = this.store.creaturesBosses()
    const tabId = this.paramTab()
    const tabs: Tab[] = []
    if (!difficulty) {
      const loot: typeof rewards = []
      const hasRewards = !!rewards?.length
      const hasLoot = !!lootNormal?.length
      if (hasRewards) {
        loot.push(...rewards)
      }
      if (hasLoot) {
        loot.push(...lootNormal)
      }
      tabs.push({
        id: 'loot',
        label: [hasRewards ? 'Rewards' : '', 'Loot'].filter((it) => !!it).join('/'),
        active: false,
        vitals: [],
        loot: loot,
        count: loot?.length || 0,
      })
    } else {
      const loot: typeof rewards = []
      const hasRewards = !!rewards?.length
      const hasLoot = !!lootMutated?.length
      if (hasRewards) {
        loot.push(...rewards)
      }
      if (hasLoot) {
        loot.push(...lootMutated)
      }
      tabs.push({
        id: 'loot',
        label: [hasRewards ? 'Rewards' : '', 'Loot'].filter((it) => !!it).join('/'),
        active: false,
        loot: loot,
        vitals: [],
        count: loot?.length || 0,
      })
      tabs.push({
        id: 'difficulty',
        label: 'Difficulty Loot',
        active: false,
        loot: lootDifficulty,
        vitals: [],
        count: lootDifficulty?.length || 0,
      })
    }
    tabs.push({
      id: 'creatures',
      label: 'Creatures',
      active: false,
      loot: [],
      vitals: vitalsCommon,
      count: vitalsCommon?.length || 0,
    })

    tabs.push({
      id: 'named',
      label: 'Named',
      active: false,
      loot: [],
      vitals: vitalsNamed,
      count: vitalsNamed?.length || 0,
    })

    tabs.push({
      id: 'bosses',
      label: 'Bosses',
      active: false,
      loot: [],
      vitals: vitalsBosses,
      count: vitalsBosses?.length || 0,
    })

    for (const tab of tabs) {
      tab.active = tab.id === tabId
    }
    if (tabs.length && !tabs.some((it) => it.active)) {
      tabs[0].active = true
    }

    return tabs
  })

  public constructor() {
    this.store.connectGameMode(this.paramGameMode)
    this.store.connectMutaCurse(this.paramCurse)
    this.store.connectMutaElement(this.paramElement)
    this.store.connectMutaPromotion(this.paramPromotion)
    this.store.connectMutaDifficulty(this.paramDifficulty)

    effect(() => {
      const dungeon = this.store.gameMode()
      if (!dungeon) {
        return
      }
      untracked(() => {
        this.head.updateMetadata({
          title: this.i18n.get(dungeon.DisplayName),
          description: this.i18n.get(dungeon.Description),
          image: dungeon.BackgroundImagePath,
        })
      })
    })
  }

  public itemId(item: MasterItemDefinitions | HouseItems) {
    return getItemId(item)
  }

  public difficultyTier(item: MutationDifficultyStaticData) {
    return DIFFICULTY_TIER_NAME[item.DifficultyTier] ?? `${item.DifficultyTier}`
  }

  public difficultyRank(dungeon: GameModeData, difficulty: MutationDifficultyStaticData) {
    if (!dungeon?.DifficultyProgressionId) {
      return of(null)
    }
    return this.character.observeGameModeProgression(dungeon.DifficultyProgressionId, difficulty.MutationDifficulty)
  }

  // public difficultyRankIcon(dungeon: GameModeData, difficulty: MutationDifficultyStaticData) {
  //   if (!dungeon || !difficulty) {
  //     return of(null)
  //   }
  //   return this.difficultiesRank$.pipe(
  //     map((ranks) => {
  //       const index = ranks.findIndex((it) => it.difficulty.MutationDifficulty === difficulty.MutationDifficulty)
  //       const rank = ranks[index]?.rank
  //       if (rank) {
  //         return this.rankIcon(rank)
  //       }
  //       if (ranks.some((it, i) => it.rank && i > index)) {
  //         return 'assets/icons/expedition/icon_check_glowing.png' // unlocked and passed
  //       }
  //       if (ranks[index - 1]?.rank || index === 0) {
  //         return null // unlocked
  //       }
  //       return `assets/icons/expedition/icon_lock_small.png`
  //     }),
  //   )
  // }

  public rankIcon(rank: number) {
    if (rank === 1) {
      return `assets/icons/expedition/mutator_rank_bronze_sm.png`
    }
    if (rank === 2) {
      return `assets/icons/expedition/mutator_rank_silver_sm.png`
    }
    if (rank === 3) {
      return `assets/icons/expedition/mutator_rank_gold_sm.png`
    }
    return `assets/icons/expedition/icon_lock_small.png`
  }

  public updateRankToGold() {
    this.updateRank(3)
  }

  public updateRankToSilver() {
    this.updateRank(2)
  }

  public updateRankToBronze() {
    this.updateRank(1)
  }

  protected handleVitalTargetEnter(vital: VitalsBaseData) {
    this.vitalTargetHover.set(vital)
  }

  protected handleVitalTargetLeave(vital: VitalsBaseData) {
    this.vitalTargetHover.set(null)
  }

  protected handleVitalTargetClick(vital: VitalsBaseData) {
    if (this.vitalTargetClick() === vital) {
      this.vitalTargetClick.set(null)
    } else {
      this.vitalTargetClick.set(vital)
    }
  }

  public updateRank(value: number) {
    if (this.dungeon() && this.difficulty()) {
      this.character.setGameModeProgression(
        this.dungeon().DifficultyProgressionId,
        this.difficulty().MutationDifficulty,
        value,
      )
    }
  }

  protected onMutaElementSelected(value: ElementalMutationStaticData) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        element: value?.CategoryWildcard || null,
      },
      queryParamsHandling: 'merge',
    })
  }

  protected onMutaPromotionSelected(value: PromotionMutationStaticData) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        promotion: value?.PromotionMutationId || null,
      },
      queryParamsHandling: 'merge',
    })
  }

  protected onMutaCurseSelected(value: CurseMutationStaticData) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        curse: value?.CurseMutationId || null,
      },
      queryParamsHandling: 'merge',
    })
  }

  protected handleVitalTabChange(tab: string) {
    if (tab === 'models') {
      return
    }
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        tabv: tab,
      },
      queryParamsHandling: 'merge',
    })
  }
}
