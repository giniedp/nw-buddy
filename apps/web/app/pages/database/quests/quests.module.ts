import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { QuestPageComponent } from './quest.component'
import { QuestsTableComponent } from './quests-table.component'
import { QuestsComponent } from './quests.component'

const routes: Routes = [
  {
    path: '',
    component: QuestsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: QuestsTableComponent,
        children: [
          {
            path: ':id',
            component: QuestPageComponent,
          },
        ],
      },
      {
        path: ':category',
        component: QuestsTableComponent,
        children: [
          {
            path: ':id',
            component: QuestPageComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class QuestsModule {}
