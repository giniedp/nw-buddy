import { Routes } from '@angular/router'
import { TransmogDetailPageComponent } from './transmog-detail-page.component'
import { TransmogPageComponent } from './transmog-page.component'
import { TransmogSetDetailComponent } from './transmog-set-detail.component'
import { TransmogSetListComponent } from './transmog-set-list.component'
import { TransmogSetNewComponent } from './transmog-set-new.component'

export const ROUTES: Routes = [
  {
    path: 'sets',
    children: [
      {
        path: '',
        redirectTo: 'local',
        pathMatch: 'full',
      },
      {
        path: 'new',
        component: TransmogSetNewComponent,
      },
      {
        path: ':userid',
        children: [
          {
            path: '',
            component: TransmogSetListComponent,
          },
          {
            path: ':id',
            component: TransmogSetDetailComponent,
          },
        ],
      },
    ],
  },
  {
    path: 'editor',
    redirectTo: 'sets/new',
  },
  {
    path: '',
    component: TransmogPageComponent,
    children: [
      {
        path: ':id',
        component: TransmogDetailPageComponent,
      },
    ],
  },
]
