import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { SkillBuildsDetailComponent } from './skill-builds-detail.component'
import { SkillBuildsShareComponent } from './skill-builds-share.component'
import { SkillBuildsComponent } from './skill-builds.component'

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
export class SkillBuildsModule {
  //
}
