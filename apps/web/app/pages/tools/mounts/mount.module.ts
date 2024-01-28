import { NgModule, inject } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterModule, Routes } from '@angular/router'
import { MountComponent } from './mount.component'
import { MountOverviewComponent } from './mount-overview.component'
import { MountItemComponent } from './mount-item.component'
import { NwDataService } from '~/data'
import { firstValueFrom } from 'rxjs'
import { eqCaseInsensitive } from '~/utils'

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
        canActivate: [redirectToCategory],
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

async function redirectToCategory(snap: ActivatedRouteSnapshot) {
  const db = inject(NwDataService)
  const router = inject(Router)

  const category = snap.paramMap.get('category')
  const id = snap.firstChild?.paramMap.get('id')
  if (!id || !category) {
    return true
  }

  const item = await firstValueFrom(db.mount(id))
  if (!item) {
    return true
  }

  if (eqCaseInsensitive(item.MountType, category)) {
    return true
  }

  router.navigate(['mounts', item.MountType, item.MountId])
  return false
}
