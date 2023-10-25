import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { ArmorWeightsPageComponent } from './armor-weights-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: ArmorWeightsPageComponent,
    children: [
      {
        path: ':id',
        component: ArmorWeightsPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
})
export class ArmorWeightsModule {}
