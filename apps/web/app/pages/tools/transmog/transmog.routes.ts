import { Routes } from '@angular/router'
import { TransmogDetailPageComponent } from './transmog-detail-page.component'
import { TransmogEditorPageComponent } from './transmog-editor-page.component'
import { TransmogPageComponent } from './transmog-page.component'

export const ROUTES: Routes = [
  {
    path: 'editor',
    component: TransmogEditorPageComponent,
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
