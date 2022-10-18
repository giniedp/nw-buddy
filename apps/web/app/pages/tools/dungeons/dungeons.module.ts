import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { DungeonsComponent } from './dungeons.component'
import { ItemDetailModule } from '~/widgets/item-detail'
import { NwModule } from '~/nw'
import { FormsModule } from '@angular/forms'
import { DungeonDetailComponent } from './dungeon-detail.component'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'
import { ScreenModule } from '~/ui/screen'
import { RouterModule, Routes } from '@angular/router'

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
