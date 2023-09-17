import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GameEventDetailPageComponent } from './game-event-detail-page.component'
import { GameEventsPageComponent } from './game-events-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: GameEventsPageComponent,
    children: [
      {
        path: ':id',
        component: GameEventDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class GameEventsPageModule {}
