import { Routes } from '@angular/router'

const ipfsRoutes: Routes = [
  {
    path: 'ipns/:name',
    loadComponent: () => import('./gearsets-share-page.component').then((it) => it.GearsetsSharePageComponent),
  },
  {
    path: 'ipfs/:cid',
    loadComponent: () => import('./gearsets-share-page.component').then((it) => it.GearsetsSharePageComponent),
  },
  {
    path: ':cid',
    loadComponent: () => import('./gearsets-share-page.component').then((it) => it.GearsetsSharePageComponent),
  },
  {
    path: ':userid/:id',
    loadComponent: () => import('./gearset-embed.component').then((it) => it.GearsetEmbedComponent),
  },
]

export const ROUTES: Routes = [
  {
    path: 'share',
    children: [...ipfsRoutes],
  },
  {
    path: 'embed',
    children: [...ipfsRoutes],
  },
  {
    path: ':userid',
    children: [
      {
        path: '',
        loadComponent: () => import('./gearsets-list-page.component').then((it) => it.GearsetsListPageComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./gearsets-detail-page.component').then((it) => it.GearsetsDetailPageComponent),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'local',
    pathMatch: 'full',
  },
]
