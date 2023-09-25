import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { RunesPageComponent } from './trophies-page.component'

const ROUTES: Routes = [
  {
    path: '',
    component: RunesPageComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  declarations: [],
})
export class TrophiesPageModule {}
