import { ActivatedRouteSnapshot, Routes } from '@angular/router'
import { SkillTreeDetailComponent } from './skill-tree-detail.component'
import { SkillTreeEmbedComponent } from './skill-tree-embed.component'
import { SkillTreeShareComponent } from './skill-tree-share.component'
import { SkillTreesPageComponent } from './skill-trees-page.component'
import { inject } from '@angular/core'
import { BackendService } from '~/data/backend'

export const ROUTES: Routes = [
  {
    path: 'embed/ipns/:name',
    component: SkillTreeEmbedComponent,
  },
  {
    path: 'embed/ipfs/:cid',
    component: SkillTreeEmbedComponent,
  },
  {
    path: 'embed/:cid',
    component: SkillTreeEmbedComponent,
  },
  {
    path: 'share/ipns/:name',
    component: SkillTreeShareComponent,
  },
  {
    path: 'share/ipfs/:cid',
    component: SkillTreeShareComponent,
  },
  {
    path: 'share/:cid',
    component: SkillTreeShareComponent,
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
