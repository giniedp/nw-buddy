import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { MountComponent } from './mount.component'
import { MountOverviewComponent } from './mount-overview.component'
import { MountItemComponent } from './mount-item.component'

const ROUTES: Routes = [
  {
    path: '',
    component: MountOverviewComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all',
      },
      {
        path: ':category',
        component: MountComponent,
        children: [
          {
            path: ':id',
            component: MountItemComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
})
export class MountModule {}
