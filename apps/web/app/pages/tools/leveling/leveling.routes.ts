import { Routes } from '@angular/router'
import { LevelXpComponent } from './level-xp.component'
import { TradeskillsComponent } from './tradeskills.component'
import { WeaponsComponent } from './weapons.component'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'xp',
  },
  {
    path: 'xp',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'progress',
      },
      {
        path: ':tab',
        component: LevelXpComponent,
      },
    ],
  },
  {
    path: 'tradeskills',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'crafting',
      },
      {
        path: ':tab',
        component: TradeskillsComponent,
      },
    ],
  },
  {
    path: 'weapons',
    component: WeaponsComponent,
  },
]
