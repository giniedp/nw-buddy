import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { SkillBuildsDetailComponent } from './skill-tree-detail.component'
import { SkillBuildsEmbedComponent } from './skill-tree-embed.component'
import { SkillBuildsShareComponent } from './skill-tree-share.component'
import { SkillBuildsComponent } from './skill-trees-page.component'

export const routes: Routes = [
  {
    path: 'embed/ipns/:name',
    component: SkillBuildsEmbedComponent,
  },
  {
    path: 'embed/ipfs/:cid',
    component: SkillBuildsEmbedComponent,
  },
  {
    path: 'embed/:cid',
    component: SkillBuildsEmbedComponent,
  },
  {
    path: 'share/ipns/:name',
    component: SkillBuildsShareComponent,
  },
  {
    path: 'share/ipfs/:cid',
    component: SkillBuildsShareComponent,
  },
  {
    path: 'share/:cid',
    component: SkillBuildsShareComponent,
  },
  {
    path: '',
    component: SkillBuildsComponent,
    children: [
      {
        path: ':id',
        component: SkillBuildsDetailComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
})
export class SkillTreesModule {
  //
}
