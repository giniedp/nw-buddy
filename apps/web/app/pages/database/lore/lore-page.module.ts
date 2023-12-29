import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LoreDetailPageComponent } from './lore-detail-page.component'
import { LorePageComponent } from './lore-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: LorePageComponent,
    children: [
      {
        path: ':id',
        component: LoreDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class LorePageModule {}
