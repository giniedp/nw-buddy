import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { StatusEffectsComponent } from './status-effects.component'

const routes: Routes = [
  {
    path: '',
    component: StatusEffectsComponent,
    children: [
      {
        path: ':id',
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StatusEffectsModuleRoutingModule {}
