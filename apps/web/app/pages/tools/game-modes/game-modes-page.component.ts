import { animate, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core'
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router'
import { Cursemutations, Elementalmutations, Gamemodes, PoiDefinition, Promotionmutations } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { NavbarModule } from '~/ui/nav-toolbar'
import { eqCaseInsensitive, selectStream } from '~/utils'
import { injectCurrentMutation } from './current-mutation.service'
import { GameModesStore } from './game-modes.store'
import { MutaCurseTileComponent } from './muta-curse-tile.component'
import { MutaElementTileComponent } from './muta-element-tile.component'
import { MutaPromotionTileComponent } from './muta-promotion-tile.component'
import { IonContent, IonHeader } from '@ionic/angular/standalone'

type GameModeCategories = 'expeditions' | 'trials' | 'pvp'

export interface CurrentMutation {
  expedition: string
  element: Elementalmutations
  promotion: Promotionmutations
  curse: Cursemutations
}

@Component({
  standalone: true,
  selector: 'nwb-game-modes-page',
  templateUrl: './game-modes-page.component.html',
  styleUrls: ['./game-modes-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    NavbarModule,
    IconsModule,
    IonHeader,
    IonContent,
    MutaElementTileComponent,
    MutaCurseTileComponent,
    MutaPromotionTileComponent,
  ],
  providers: [GameModesStore],
  host: {
    class: 'ion-page',
  },
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('0.150s ease-out', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate('0.150s ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class GameModesPageComponent {
  protected groups$ = selectStream(this.db.data.gamemodes(), groupByCategory)
  protected categories$ = selectStream(this.groups$, (it) => Object.keys(it).sort())
  protected categoryId$ = selectStream(this.route.paramMap, (it) => it.get('category'))
  protected modes$ = selectStream(
    {
      pois: this.db.pois,
      categories: this.groups$,
      category: this.categoryId$,
      mutations: injectCurrentMutation(),
      cursesMap: this.db.mutatorCursesMap,
      elements: this.db.mutatorElements,
      promotionsMap: this.db.mutatorPromotionsMap,
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

  public constructor(
    private db: NwDataService,
    private route: ActivatedRoute,
  ) {
    //
  }
}

function groupByCategory(modes: Gamemodes[]) {
  const groups: Record<string, Gamemodes[]> = {}
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
  pois: PoiDefinition[],
  categories: Record<string, Gamemodes[]>,
  category: string,
  mutations: Array<CurrentMutation>,
) {
  pois = pois.filter((it) => !!it.GameMode)
  let modes: Gamemodes[] = []
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
        id: mode.GameModeId,
        icon: mode.IconPath,
        backgroundImage: mode.BackgroundImagePath,
        title: poi?.NameLocalizationKey || mode.DisplayName,
        description: poi ? `${poi.NameLocalizationKey}_description` : mode.Description,
        isMutable: mode.IsMutable,
        isMutated: !!mutation,
        mutation: mutation,
      }
    })
}

function detectCategory(mode?: Gamemodes): GameModeCategories {
  if (!mode) {
    return null
  }
  if (mode.GameModeId.startsWith('Dungeon')) {
    return 'expeditions'
  }
  if (mode.GameModeId.startsWith('Trial') || mode.GameModeId.startsWith('Quest')) {
    return 'trials'
  }
  if (
    //mode.GameModeId.startsWith('Duel') ||
    mode.GameModeId.startsWith('Arena3v3') ||
    mode.GameModeId.startsWith('OutpostRush')
  ) {
    return 'pvp'
  }
  return null
}
