import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { DamageDetailPageComponent } from './damage-detail-page.component'
import { DamagePageComponent } from './damage-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: DamagePageComponent,
    children: [
      {
        path: ':id',
        component: DamageDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class DamagePageModule {}
