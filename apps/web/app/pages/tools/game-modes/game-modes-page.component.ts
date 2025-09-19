import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core'
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import {
  CurseMutationStaticData,
  ElementalMutationStaticData,
  GameModeData,
  GameModeMapData,
  PromotionMutationStaticData,
  TerritoryDefinition,
} from '@nw-data/generated'
import { groupBy } from 'lodash'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { NavbarModule } from '~/ui/nav-toolbar'
import { eqCaseInsensitive, injectParam, resourceValue } from '~/utils'
import { injectCurrentMutation } from './current-mutation.service'
import { GameModePageTileComponent } from './game-modes-page-tile.component'

type GameModeCategories = 'expeditions' | 'soul-trials' | 'season-trials' | 'raids' | 'activities'

export interface CurrentMutation {
  expedition: string
  element: ElementalMutationStaticData
  promotion: PromotionMutationStaticData
  curse: CurseMutationStaticData
}

@Component({
  selector: 'nwb-game-modes-page',
  templateUrl: './game-modes-page.component.html',
  styleUrl: './game-modes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    NavbarModule,
    LayoutModule,
    IonSegment,
    IonSegmentButton,
    IconsModule,
    GameModePageTileComponent,
  ],
  host: {
    class: 'ion-page',
  },
})
export class GameModesPageComponent {
  private db = injectNwData()
  private route = inject(ActivatedRoute)

  private activeMutations = injectCurrentMutation()
  private mutations = resourceValue({
    keepPrevious: true,
    defaultValue: [],
    params: () => this.activeMutations() || [],
    loader: async ({ params }) => {
      const result = await Promise.all(
        params.map(async (it): Promise<CurrentMutation> => {
          return {
            expedition: it.expedition,
            element: await this.db.mutatorElementsByCategory(it.element).then((it) => it?.[0]),
            promotion: await this.db.mutatorPromotionsById(it.promotion),
            curse: await this.db.mutatorCursesById(it.curse),
          }
        }),
      )
      return result || []
    },
  })

  protected tabParam = injectParam('category', { transform: (it): GameModeCategories => (it as any) || 'expeditions' })
  protected tabs = resourceValue({
    keepPrevious: true,
    defaultValue: [],
    params: () => {
      return {
        mutations: this.mutations(),
      }
    },
    loader: async ({ params: { mutations } }) => {
      const gameModes = await this.db.gameModesAll()
      const gameMaps = await this.db.gameModesMapsAll()
      const territoriesMap = await this.db.territoriesByGameModeMap()
      const tiles = selectTiles({
        territoriesMap,
        gameModes,
        gameMaps,
        mutations,
      })
      const groups = groupBy(tiles, (it) => it.category)
      return Object.entries(groups)
        .map(([key, list]) => {
          return {
            id: key,
            tiles: list,
          }
        })
        .sort((a, b) => a.id.localeCompare(b.id))
    },
  })
  protected tab = computed(() => this.tabs().find((it) => it.id === this.tabParam()))

  protected outlet = viewChild(RouterOutlet)
  protected iconBack = svgChevronLeft
}

function selectTiles({
  territoriesMap,
  gameModes,
  gameMaps,
  mutations,
}: {
  territoriesMap: Map<string, TerritoryDefinition[]>
  gameModes: GameModeData[]
  gameMaps: GameModeMapData[]
  mutations: CurrentMutation[]
}) {
  return gameModes
    .sort((a, b) => (a.RequiredLevel || 0) - (b.RequiredLevel || 0))
    .map((mode) => {
      const modeMaps = gameMaps.filter((it) => eqCaseInsensitive(mode.GameModeId, it.GameModeId))
      const mutation = mutations.find((it) => eqCaseInsensitive(it.expedition, mode.GameModeId))
      const poi = territoriesMap.get(mode.GameModeId)?.[0]
      return modeMaps.map((map) => {
        const mapName = map.UIMapDisplayName
        const modeName = mode.DisplayName
        const poiName = poi?.NameLocalizationKey
        const poiDescription = poi ? `${poi.NameLocalizationKey}_description` : null
        return {
          id: map.GameModeMapId.toLowerCase(),
          modeId: mode.GameModeId.toLowerCase(),
          mapName,
          modeName,
          poiName,
          description: poiDescription || mode.Description,
          icon: mode.IconPath,
          category: detectCategory(mode),
          backgroundImage: mode.BackgroundImagePath || mode.SimpleImagePath,
          isMutable: mode.IsMutable,
          isMutated: !!mutation,
          mutation: mutation,
        }
      })
    })
    .flat()
    .filter((it) => !!it.category && !!it.modeName)
}

function detectCategory(mode?: GameModeData): GameModeCategories {
  if (!mode) {
    return null
  }
  if (eqCaseInsensitive(mode.GameModeId, 'mutation') || eqCaseInsensitive(mode.GameModeId, 'dungeon')) {
    // useless dummies
    return null
  }
  if (mode.IsSoloTrial) {
    return 'soul-trials'
  }
  if (mode.IsSeasonTrial) {
    return 'season-trials'
  }
  if (mode.IsRaidTrial) {
    return 'raids'
  }
  if (mode.IsDungeon) {
    return 'expeditions'
  }
  if (mode.ActivityType) {
    return 'activities'
  }
  return null
}
