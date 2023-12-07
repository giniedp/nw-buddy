import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core'
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router'
import { Gamemodes } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { NavbarModule } from '~/ui/nav-toolbar'
import { eqCaseInsensitive, selectStream } from '~/utils'
import { GameModesStore } from './game-modes.store'
import { MutationEntry, MutationList, injectCurrentMutation } from './current-mutation.service'
import { animate, style, transition, trigger } from '@angular/animations'

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
      categories: this.groups$,
      category: this.categoryId$,
      mutations: injectCurrentMutation(),
    },
    ({ categories, category, mutations }) => selectCategory(categories, category, mutations)
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

function selectCategory(categories: Record<string, Gamemodes[]>, category: string, mutations: MutationList) {

  let modes: Gamemodes[] = []
  if (category === 'all') {
    modes = Object.entries(categories)
      .map(([_, value]) => value)
      .flat(1)
  } else {
    modes = categories[category] || []
  }

  return modes.sort((a, b) => a.RequiredLevel - b.RequiredLevel).map((mode) => {
    const mutation = mutations?.find((it) => eqCaseInsensitive(it.expedition, mode.GameModeId))
    return {
      id: mode.GameModeId,
      icon: mode.IconPath,
      backgroundImage: mode.BackgroundImagePath,
      name: mode.DisplayName,
      isMutable: mode.IsMutable,
      isMutated: !!mutation,
      mutation: mutation
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
