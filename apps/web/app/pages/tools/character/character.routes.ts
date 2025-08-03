import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./character.component').then((it) => it.CharacterPageController),
    children: [
      {
        path: '',
        loadComponent: () => import('./bio.component').then((it) => it.BioComponent),
      },
      {
        path: 'level',
        loadComponent: () => import('./level.component').then((it) => it.LevelXpComponent),
      },
      {
        path: 'tradeskills',
        loadComponent: () => import('./tradeskills.component').then((it) => it.TradeskillsComponent),
      },
      {
        path: 'standing',
        loadComponent: () => import('./standing.component').then((it) => it.StandingComponent),
      },
      {
        path: 'weapons',
        loadComponent: () => import('./weapons.component').then((it) => it.WeaponsComponent),
      },
    ],
  },
]
