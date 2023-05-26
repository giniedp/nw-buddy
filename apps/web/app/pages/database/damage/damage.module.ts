import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { DamagePageComponent } from './damage.component'
import { DamageTablePageComponent } from './damage-table.component'
import { DamageDetailPageComponent } from './damage-detail.component'

const routes: Routes = [
  {
    path: '',
    component: DamagePageComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'table',
      },
      {
        path: 'table',
        component: DamageTablePageComponent,
        children: [{
          path: ':id',
          component: DamageDetailPageComponent
        }]
      },
      {
        path: ':category',
        component: DamageTablePageComponent,
        children: [{
          path: ':id',
          component: DamageDetailPageComponent
        }]
      },
    ]
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
})
export class DamageModule {}
