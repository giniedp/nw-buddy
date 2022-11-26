import { NgModule } from '@angular/core'

import { RouterModule, Routes } from '@angular/router'
import { DungeonDetailComponent } from './dungeon-detail.component'
import { DungeonsComponent } from './dungeons.component'

const routes: Routes = [
  {
    path: '',
    component: DungeonsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'DungeonAmrine'
      },
      {
        path: ':id',
        component: DungeonDetailComponent,
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class DungeonsModule {}
