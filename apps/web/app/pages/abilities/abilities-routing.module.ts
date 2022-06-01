import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AbilitiesTableComponent } from './abilities-table.component'
import { AbilitiesComponent } from './abilities.component'

const routes: Routes = [
  {
    path: '',
    component: AbilitiesComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: AbilitiesTableComponent,
        children: [{
          path: ':id'
        }]
      },
      {
        path: ':category',
        component: AbilitiesTableComponent,
        children: [{
          path: ':id'
        }]
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AbilitiesRoutingModule {}
