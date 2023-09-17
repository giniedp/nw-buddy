import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LootDetailPageComponent } from './loot-detail-page.component'
import { LootPageComponent } from './loot-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: LootPageComponent,
    children: [
      {
        path: ':id',
        component: LootDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class LootPageModule {}
