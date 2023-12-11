import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { EmotesDetailPageComponent } from './emotes-detail-page.component'
import { DamagePageComponent } from './emotes-page.component'

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
        component: EmotesDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class EmotesPageModule {}
