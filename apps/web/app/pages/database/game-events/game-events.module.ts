import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { EmptyComponent } from '~/widgets/empty'
import { GameEventDetailComponent } from './game-event-detail.component'

import { GameEventsTableComponent } from './game-events-table.component'
import { GameEventsComponent } from './game-events.component'

const routes: Routes = [
  {
    path: '',
    component: GameEventsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: GameEventsTableComponent,
        children: [
          {
            path: ':id',
            component: GameEventDetailComponent,
          },
        ],
      },
      {
        path: ':category',
        component: GameEventsTableComponent,
        children: [
          {
            path: ':id',
            component: EmptyComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class GameEventsModule {}
