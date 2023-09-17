import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { QuestDetailPageComponent } from './quest-detail-page.component'
import { QuestsPageComponent } from './quests-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: QuestsPageComponent,
    children: [
      {
        path: ':id',
        component: QuestDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class QuestsPageModule {}
