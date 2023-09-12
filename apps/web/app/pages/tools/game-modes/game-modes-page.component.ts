import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core'
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router'
import { Gamemodes } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { NavbarModule } from '~/ui/nav-toolbar'
import { selectStream } from '~/utils'
import { GameModesStore } from './game-modes.store'

type GameModeCategories = 'expeditions' | 'trials' | 'pvp'

@Component({
  standalone: true,
  selector: 'nwb-game-modes-page',
  templateUrl: './game-modes-page.component.html',
  styleUrls: ['./game-modes-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, NavbarModule, IconsModule],
  providers: [GameModesStore],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
})
export class GameModesPageComponent {
  protected groups$ = selectStream(this.db.data.gamemodes(), groupByCategory)
  protected categories$ = selectStream(this.groups$, (it) => Object.keys(it).sort())
  protected categoryId$ = selectStream(this.route.paramMap, (it) => it.get('category'))
  protected modes$ = selectStream(
    {
      categories: this.groups$,
      category: this.categoryId$,
    },
    ({ categories, category }) => selectCategory(categories, category)
  )

  @ViewChild(RouterOutlet, { static: true })
  protected outlet: RouterOutlet
  protected iconBack = svgChevronLeft

  public constructor(private db: NwDbService, private route: ActivatedRoute) {
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

function selectCategory(categories: Record<string, Gamemodes[]>, category: string) {
  let result: Gamemodes[] = []
  if (category === 'all') {
    result = Object.entries(categories)
      .map(([_, value]) => value)
      .flat(1)
  } else {
    result = categories[category] || []
  }
  return result.sort((a, b) => a.RequiredLevel - b.RequiredLevel)
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
