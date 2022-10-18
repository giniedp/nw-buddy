import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LevelXpComponent } from './level-xp.component'

const routes: Routes = [
  {
    path: '',
    component: LevelXpComponent,
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
})
export class LevelXpModule {
  //
}
