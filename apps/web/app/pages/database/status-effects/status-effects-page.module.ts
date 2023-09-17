import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { StatusEffectsDetailPageComponent } from './status-effects-detail-page.component'
import { StatusEffectsPageComponent } from './status-effects-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: StatusEffectsPageComponent,
    children: [
      {
        path: ':id',
        component: StatusEffectsDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class StatusEffectsPageModule {}
