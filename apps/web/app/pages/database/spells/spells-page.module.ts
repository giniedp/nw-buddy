import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { SpellsDetailPageComponent } from './spells-detail-page.component'
import { SpellsPageComponent } from './spells-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: SpellsPageComponent,
    children: [
      {
        path: ':id',
        component: SpellsDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class SpellsPageModule {}
