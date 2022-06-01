import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { StatusEffectsTableComponent } from './status-effects-table.component'
import { StatusEffectsComponent } from './status-effects.component'

const routes: Routes = [
  {
    path: '',
    component: StatusEffectsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: StatusEffectsTableComponent,
        children: [{
          path: ':id'
        }]
      },
      {
        path: ':category',
        component: StatusEffectsTableComponent,
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
export class StatusEffectsRoutingModule {}
