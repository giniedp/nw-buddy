import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core'
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import {
  CurseMutationStaticData,
  ElementalMutationStaticData,
  GameModeData,
  PromotionMutationStaticData,
  TerritoryDefinition,
} from '@nw-data/generated'
import { from } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { NavbarModule } from '~/ui/nav-toolbar'
import { eqCaseInsensitive, injectChildRouteParam, selectStream } from '~/utils'
import { injectCurrentMutation } from './current-mutation.service'
import { GameModesStore } from './game-modes.store'
import { MutaCurseTileComponent } from './muta-curse-tile.component'
import { MutaElementTileComponent } from './muta-element-tile.component'
import { MutaPromotionTileComponent } from './muta-promotion-tile.component'

type GameModeCategories = 'expeditions' | 'trials' | 'raids' | 'activities'

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
    MutaElementTileComponent,
    MutaCurseTileComponent,
    MutaPromotionTileComponent,
  ],
  providers: [GameModesStore],
  host: {
    class: 'ion-page',
  },
})
export class GameModesPageComponent {
  private db = injectNwData()
  private route = inject(ActivatedRoute)

  protected gameModeId$ = injectChildRouteParam(':id')
  protected groups$ = selectStream(from(this.db.gameModesAll()), groupByCategory)
  protected categories$ = selectStream(this.groups$, (it) => Object.keys(it).sort())
  protected categoryId$ = selectStream(this.route.paramMap, (it) => it.get('category'))
  protected modes$ = selectStream(
    {
      pois: this.db.territoriesAll(),
      categories: this.groups$,
      category: this.categoryId$,
      mutations: injectCurrentMutation(),
      cursesMap: this.db.mutatorCursesByIdMap(),
      elements: this.db.mutatorElementsAll(),
      promotionsMap: this.db.mutatorPromotionsByIdMap(),
    },
    ({ pois, categories, category, mutations, cursesMap, elements, promotionsMap }) => {
      return selectCategory(
        pois,
        categories,
        category,
        mutations?.map((it) => {
          return {
            expedition: it.expedition,
            element: elements.find((el) => el.CategoryWildcard === it.element && el.ElementalDifficultyTier === 3),
            promotion: promotionsMap.get(it.promotion),
            curse: cursesMap.get(it.curse),
          }
        }) || [],
      )
    },
  )

  @ViewChild(RouterOutlet, { static: true })
  protected outlet: RouterOutlet
  protected iconBack = svgChevronLeft
}

function groupByCategory(modes: GameModeData[]) {
  const groups: Record<string, GameModeData[]> = {}
  for (const mode of modes) {
    const category = detectCategory(mode)
    if (!category) {
      continue
    }
    groups[category] = groups[category] || []
    groups[category].push(mode)
  }
  return groups
}

function selectCategory(
  pois: TerritoryDefinition[],
  categories: Record<string, GameModeData[]>,
  category: string,
  mutations: Array<CurrentMutation>,
) {
  pois = pois.filter((it) => !!it.GameMode)
  let modes: GameModeData[] = []
  if (category === 'all') {
    modes = Object.entries(categories)
      .map(([_, value]) => value)
      .flat(1)
  } else {
    modes = categories[category] || []
  }

  return modes
    .sort((a, b) => a.RequiredLevel - b.RequiredLevel)
    .map((mode) => {
      const poi = pois.find((it) => eqCaseInsensitive(it.GameMode, mode.GameModeId))
      const mutation = mutations?.find((it) => eqCaseInsensitive(it.expedition, mode.GameModeId))
      return {
        id: mode.GameModeId.toLowerCase(),
        icon: mode.IconPath,
        backgroundImage: mode.BackgroundImagePath || mode.SimpleImagePath,
        title: poi?.NameLocalizationKey || mode.DisplayName,
        description: poi ? `${poi.NameLocalizationKey}_description` : mode.Description,
        isMutable: mode.IsMutable,
        isMutated: !!mutation,
        mutation: mutation,
      }
    })
}

function detectCategory(mode?: GameModeData): GameModeCategories {
  if (!mode) {
    return null
  }
  if (mode.IsSoloTrial || mode.IsSeasonTrial) {
    return 'trials'
  }
  if (mode.IsRaidTrial) {
    return 'raids'
  }
  if (mode.IsDungeon) {
    return 'expeditions'
  }
  // if (mode.ActivityType) {
  //   return 'activities'
  // }
  return null
}
