import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { RunesPageComponent } from './runes-page.component'

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
export class RunesPageModule {}
