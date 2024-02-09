import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LevelXpComponent } from './level-xp.component'
import { TradeskillsComponent } from './tradeskills.component'
import { WeaponsComponent } from './weapons.component'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'xp',
  },
  {
    path: 'xp',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'progress',
      },
      {
        path: ':tab',
        component: LevelXpComponent,
      },
    ],
  },
  {
    path: 'tradeskills',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'crafting',
      },
      {
        path: ':tab',
        component: TradeskillsComponent,
      },
    ],
  },
  {
    path: 'weapons',
    component: WeaponsComponent,
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
})
export class LevelingModule {
  //
}
