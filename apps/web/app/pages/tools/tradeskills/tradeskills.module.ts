import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { TradeskillsComponent } from './tradeskills.component'

const routes: Routes = [
  {
    path: '',
    component: TradeskillsComponent
  }
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
})
export class TradeskillsModule {
  //
}
