import { Routes } from '@angular/router'
import { SkillTreeDetailComponent } from './skill-tree-detail.component'
import { SkillTreeEmbedComponent } from './skill-tree-embed.component'
import { SkillTreeShareComponent } from './skill-tree-share.component'
import { SkillTreesPageComponent } from './skill-trees-page.component'

export const ROUTES: Routes = [
  {
    path: 'embed',
    children: [
      {
        path: 'ipns/:name',
        component: SkillTreeEmbedComponent,
      },
      {
        path: 'ipfs/:cid',
        component: SkillTreeEmbedComponent,
      },
      {
        path: ':cid',
        component: SkillTreeEmbedComponent,
      },
      {
        path: ':userid',
        children: [
          {
            path: ':id',
            component: SkillTreeDetailComponent,
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
        component: SkillTreeShareComponent,
      },
      {
        path: 'ipfs/:cid',
        component: SkillTreeShareComponent,
      },
      {
        path: ':cid',
        component: SkillTreeShareComponent,
      },
    ],
  },
  {
    path: ':userid',
    component: SkillTreesPageComponent,
    children: [
      {
        path: ':id',
        component: SkillTreeDetailComponent,
      },
    ],
  },
  {
    path: '',
    redirectTo: 'local',
    pathMatch: 'full',
  },
]
