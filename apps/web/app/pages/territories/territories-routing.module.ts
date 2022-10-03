import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PoiTableComponent } from './poi-table.component'
import { TerritoriesDetailComponent } from './territories-detail.component'
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
        children: [
          {
            path: ':id',
            component: TerritoriesDetailComponent,
          },
        ],
      },
      {
        path: 'standing',
        component: TerritoriesStandingComponent,
      },
      {
        path: 'governance',
        component: TerritoriesGovernanceComponent
      },
      {
        path: 'poi',
        component: PoiTableComponent,
      },
    ],
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TerritoriesRoutingModule {}
