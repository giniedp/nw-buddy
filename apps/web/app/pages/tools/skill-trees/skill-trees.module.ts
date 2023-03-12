import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { SkillBuildsDetailComponent } from './skill-tree-detail.component'
import { SkillBuildsShareComponent } from './skill-tree-share.component'
import { SkillBuildsComponent } from './skill-trees-page.component'

export const routes: Routes = [
  {
    path: '',
    component: SkillBuildsComponent,
    children: [
      {
        path: 'share/:cid',
        component: SkillBuildsShareComponent,
      },
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
