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
import { CharacterStore } from '~/data'
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
    GameModeDetailLootComponent,
    GameModeDetailMapComponent,
    GameModeDetailVitalsComponent,
    IconsModule,
    ItemDetailModule,
    LayoutModule,
    LootModule,
    MutaCurseTileComponent,
    MutaElementTileComponent,
    MutaPromotionTileComponent,
    NwModule,
    PaginationModule,
    RouterModule,
    TooltipModule,
    VitalDetailModule,
  ],
  providers: [GameModeStore],
  host: {
    class: 'ion-page',
  },
})
export class GameModeDetailComponent {
  private route = inject(ActivatedRoute)
  private router = inject(Router)

  protected store = inject(GameModeStore)
  private character = inject(CharacterStore)
  private i18n = inject(TranslateService)
  private head = inject(HtmlHeadService)

  protected paramMapId = injectParam('id')
  protected paramCurse = injectQueryParam('curse')
  protected paramElement = injectQueryParam('element')
  protected paramPromotion = injectQueryParam('promotion')
  protected paramDifficulty = injectQueryParam('difficulty', { transform: (it) => Number(it) || null })
  protected paramTab = injectQueryParam('tab', { transform: (it) => it || '' })
  protected paramTabVitals = injectQueryParam('tabv')

  protected currentMutations = injectCurrentMutation()
  protected activeMutation = computed(() => {
    const modeId = this.store.gameModeId()
    return this.currentMutations()?.find((it) => {
      return eqCaseInsensitive(it.expedition, modeId)
    })
  })

  protected mapPinned = signal(false)
  protected iconTarget = svgLocationCrosshairs
  protected iconPin = svgThumbtack
  protected vitalTargetHover = signal<VitalsBaseData>(null)
  protected vitalTargetClick = signal<VitalsBaseData>(null)

  public iconExtern = svgSquareArrowUpRight
  public iconInfo = svgInfoCircle

  public gameMap = this.store.gameMap
  public gameMode = this.store.gameMode
  public isMutable = this.store.isMutable

  public creaturesBosses = this.store.creaturesBosses
  public creaturesNamed = this.store.creaturesNamed
  public creaturesCommon = this.store.creaturesCommon

  public difficulty = this.store.mutaDifficulty
  public difficultyLevel = this.store.mutaDifficultyLevel
  public difficulties = this.store.mutaDifficulties

  public modeName = computed(() => this.gameMode()?.DisplayName)
  public mapName = computed(() => this.gameMap()?.UIMapDisplayName)
  public description = computed(() => this.gameMode()?.Description)
  public icon = computed(() => this.gameMode()?.IconPath)
  public backgroundImage = computed(() => this.gameMode()?.BackgroundImagePath)
  public requiredLevel = computed(() => {
    return this.difficultyLevel() ? NW_MAX_CHARACTER_LEVEL : this.gameMode()?.RequiredLevel
  })
  public recommendedLevel = computed(() => this.gameMode()?.RecommendedLevel)
  public requiredGearScore = computed(() => this.difficulty()?.RecommendedGearScore)
  public recommendedGsMin = computed(() => this.gameMode()?.GearScoreRecommendedValueMin)
  public recommendedGsMax = computed(() => this.gameMode()?.GearScoreRecommendedValueMax)

  public matchmakingGsMin = computed(() => this.gameMode()?.MatchmakingMinGS)
  public matchmakingLvlMin = computed(() => this.gameMode()?.MatchmakingMinLevel)
  public matchmakingLvlMax = computed(() => this.gameMode()?.MatchmakingMaxLevel)
  public matchmakingTanksMin = computed(() => this.gameMode()?.MatchmakingMinTanks)
  public matchmakingTanksMax = computed(() => this.gameMode()?.MatchmakingMaxTanks)
  public matchmakingDpsMin = computed(() => this.gameMode()?.MatchmakingMinDPS)
  public matchmakingDpsMax = computed(() => this.gameMode()?.MatchmakingMaxDPS)
  public matchmakingHealMin = computed(() => this.gameMode()?.MatchmakingMinHealers)
  public matchmakingHealMax = computed(() => this.gameMode()?.MatchmakingMaxHealers)
  public mapRotation = computed(() => {
    const seconds = this.gameMode()?.MapRotationTimeSpanInSeconds
    return seconds ? secondsToDuration(seconds) : null
  })
  public projectedDuration = computed(() => {
    const minutes = this.gameMode()?.ProjectedDurationMinutes
    return minutes ? secondsToDuration(minutes * 60) : null
  })

  public requirementText = computed(() => this.gameMode()?.RequirementText)
  public groupSizeMin = computed(() => this.gameMode()?.MinGroupSize)
  public groupSizeMax = computed(() => this.gameMode()?.TeamCapacity)
  public lootGsRange = computed(() => this.difficulty()?.LootGSRangeOverride || this.gameMode()?.LootGSRangeOverride)

  public tplRewards = viewChild('tplRewards', { read: TemplateRef })
  public tplExplain = viewChild('tplExplain', { read: TemplateRef })

  public activeTab = computed(() => this.tabs().find((it) => it.active))
  public tabs = computed(() => {
    const difficulty = this.store.mutaDifficulty()
    // const rewards = this.store.completionRewards()
    const lootNormal = this.store.lootItems()
    const lootMutated = this.store.lootMutated()
    const lootDifficulty = this.store.lootDifficulty()
    const vitalsCommon = this.store.creaturesCommon()
    const vitalsNamed = this.store.creaturesNamed()
    const vitalsBosses = this.store.creaturesBosses()
    const tabId = this.paramTab()
    const tabs: Tab[] = []
    if (!difficulty) {
      tabs.push({
        id: 'loot',
        label: 'Loot',
        active: false,
        vitals: [],
        loot: lootNormal,
        count: lootNormal?.length || 0,
      })
    } else {
      tabs.push({
        id: 'loot',
        label: 'Loot',
        active: false,
        vitals: [],
        loot: lootMutated,
        count: lootMutated?.length || 0,
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
    this.store.connectMap(this.paramMapId)
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
    if (this.gameMode() && this.difficulty()) {
      this.character.setGameModeProgression(
        this.gameMode().DifficultyProgressionId,
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

function secondsToDuration(value: number) {
  const milliseconds = Math.floor(value * 1000) % 1000
  const seconds = Math.floor(value % 60)
  const minutes = Math.floor(value / 60) % 60
  const hours = Math.floor(value / 3600) % 24
  const days = Math.floor(value / 86400)
  const result = []
  if (milliseconds) {
    result.push(`${milliseconds}ms`)
  }
  if (seconds) {
    result.push(`${seconds}s`)
  }
  if (minutes) {
    result.push(`${minutes}m`)
  }
  if (hours) {
    result.push(`${hours}h`)
  }
  if (days) {
    result.push(`${days}d`)
  }
  return result.reverse().join(' ')
}
