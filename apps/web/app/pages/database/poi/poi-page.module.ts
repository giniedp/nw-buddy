import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { PoiPageComponent } from './poi-page.component'
import { EmptyComponent } from '~/widgets/empty'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: PoiPageComponent,
    children: [
      {
        path: ':id',
        component: EmptyComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class PoiPageModule {}
