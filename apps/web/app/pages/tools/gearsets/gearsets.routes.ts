import { Routes } from '@angular/router'
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
        component: GearsetsListPageComponent,
      },
      {
        path: ':id',
        component: GearsetsDetailPageComponent,
      },
    ],
  },
  {
    path: '',
    redirectTo: 'local',
    pathMatch: 'full',
  },
]
