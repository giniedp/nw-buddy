import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: 'sets',
    children: [
      {
        path: '',
        redirectTo: 'local',
        pathMatch: 'full',
      },
      {
        path: 'new',
        loadComponent: () => import('./transmog-set-new.component').then((it) => it.TransmogSetNewComponent),
      },
      {
        path: ':userid',
        children: [
          {
            path: '',
            loadComponent: () => import('./transmog-set-list.component').then((it) => it.TransmogSetListComponent),
          },
          {
            path: ':id',
            loadComponent: () => import('./transmog-set-detail.component').then((it) => it.TransmogSetDetailComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'editor',
    redirectTo: 'sets/new',
  },
  {
    path: '',
    loadComponent: () => import('./transmog-page.component').then((it) => it.TransmogPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./transmog-detail-page.component').then((it) => it.TransmogDetailPageComponent),
      },
    ],
  },
]
