import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GearsetsDetailPageComponent } from './gearsets-detail-page.component'
import { GearsetsListPageComponent } from './gearsets-list-page.component'
import { GearsetsSharePageComponent } from './gearsets-share-page.component'

const ipfsRoutes: Routes = [
  {
    path: 'ipns/:name',
    component: GearsetsSharePageComponent,
  },
  {
    path: 'ipfs/:cid',
    component: GearsetsSharePageComponent,
  },
  {
    path: ':cid',
    component: GearsetsSharePageComponent,
  },
]

export const routes: Routes = [
  {
    path: 'share',
    children: [...ipfsRoutes],
  },
  {
    path: 'embed',
    children: [...ipfsRoutes],
  },
  {
    path: '',
    component: GearsetsListPageComponent,
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
