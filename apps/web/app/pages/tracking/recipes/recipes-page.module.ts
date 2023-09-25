import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { RecipesPageComponent } from './recipes-page.component'
import { RecipesTrackingComponent } from './recipes-tracking.component'

const ROUTES: Routes = [
  {
    path: '',
    component: RecipesPageComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: RecipesTrackingComponent,
      },
      {
        path: ':category',
        component: RecipesTrackingComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class RecipesPageModule {}
