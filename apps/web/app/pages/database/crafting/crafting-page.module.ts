import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { CraftingDetailPageComponent } from './crafting-detail-page.component'
import { CraftingPageComponent } from './crafting-page.component'

const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'table',
  },
  {
    path: ':category',
    component: CraftingPageComponent,
    children: [
      {
        path: ':id',
        component: CraftingDetailPageComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class CraftingPageModule {}
