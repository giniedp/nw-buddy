import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./quests-page.component').then((it) => it.QuestsPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./quest-detail-page.component').then((it) => it.QuestDetailPageComponent),
      },
    ],
  },
]
