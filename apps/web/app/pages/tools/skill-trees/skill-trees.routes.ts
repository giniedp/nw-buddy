import { Routes } from '@angular/router'

export const ROUTES: Routes = [
  {
    path: 'embed',
    children: [
      {
        path: 'ipns/:name',
        loadComponent: () => import('./skill-tree-embed.component').then((it) => it.SkillTreeEmbedComponent),
      },
      {
        path: 'ipfs/:cid',
        loadComponent: () => import('./skill-tree-embed.component').then((it) => it.SkillTreeEmbedComponent),
      },
      {
        path: ':cid',
        loadComponent: () => import('./skill-tree-embed.component').then((it) => it.SkillTreeEmbedComponent),
      },
      {
        path: ':userid',
        children: [
          {
            path: ':id',
            loadComponent: () => import('./skill-tree-detail.component').then((it) => it.SkillTreeDetailComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'share',
    children: [
      {
        path: 'ipns/:name',
        loadComponent: () => import('./skill-tree-share.component').then((it) => it.SkillTreeShareComponent),
      },
      {
        path: 'ipfs/:cid',
        loadComponent: () => import('./skill-tree-share.component').then((it) => it.SkillTreeShareComponent),
      },
      {
        path: ':cid',
        loadComponent: () => import('./skill-tree-share.component').then((it) => it.SkillTreeShareComponent),
      },
    ],
  },
  {
    path: ':userid',
    loadComponent: () => import('./skill-trees-page.component').then((it) => it.SkillTreesPageComponent),
    children: [
      {
        path: ':id',
        loadComponent: () => import('./skill-tree-detail.component').then((it) => it.SkillTreeDetailComponent),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'local',
    pathMatch: 'full',
  },
]
