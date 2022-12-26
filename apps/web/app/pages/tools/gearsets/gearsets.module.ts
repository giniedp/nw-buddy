import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GearsetsDetailPageComponent } from './gearsets-detail-page.component'
import { GearsetsPageComponent } from './gearsets-page.component'
import { GearsetsSharePageComponent } from './gearsets-share-page.component'

export const routes: Routes = [
  {
    path: '',
    component: GearsetsPageComponent,
  },
  {
    path: 'share/:cid',
    component: GearsetsSharePageComponent,
  },
  {
    path: ':id',
    component: GearsetsDetailPageComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
})
export class GearsetsModule {
  //
}
