import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { EmptyComponent } from '~/widgets/empty'

import { TerritoriesGovernanceComponent } from './territories-governance.component'
import { TerritoriesListComponent } from './territories-list.component'
import { TerritoriesStandingComponent } from './territories-standing.component'
import { TerritoriesComponent } from './territories.component'

const routes: Routes = [
  {
    path: '',
    component: TerritoriesComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
      {
        path: 'list',
        component: TerritoriesListComponent,
      },
      {
        path: 'standing',
        component: TerritoriesStandingComponent,
      },
      {
        path: 'governance',
        component: TerritoriesGovernanceComponent,
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
})
export class TerritoriesModule {
  //
}
