import { NgModule, inject } from '@angular/core'
import { ActivatedRoute, ActivatedRouteSnapshot, Router, RouterModule, Routes } from '@angular/router'
import { combineLatest, firstValueFrom } from 'rxjs'
import { NwDbService } from '~/nw'
import { eqCaseInsensitive } from '~/utils'
import { TRANSMOG_CATEGORIES, matchTransmogCateogry } from '~/widgets/data/appearance-detail'
import { TransmogItemComponent } from './transmog-item.component'
import { TransmogOverviewComponent } from './transmog-overview.component'
import { TransmogComponent } from './transmog.component'

const ROUTES: Routes = [
  {
    path: '',
    component: TransmogOverviewComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: TRANSMOG_CATEGORIES[0].id,
      },
      {
        path: ':category',
        component: TransmogComponent,
        canActivate: [redirectTocategory],
        children: [
          {
            path: ':id',
            component: TransmogItemComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
})
export class TransmogModule {}

async function redirectTocategory(snap: ActivatedRouteSnapshot) {
  const db = inject(NwDbService)
  const router = inject(Router)

  const category = snap.paramMap.get('category')
  if (TRANSMOG_CATEGORIES.some((it) => eqCaseInsensitive(it.id, category))) {
    return true
  }
  const id = snap.firstChild?.paramMap.get('id')
  if (!id) {
    router.navigate(['transmog', TRANSMOG_CATEGORIES[0].id])
    return false
  }

  const items = await firstValueFrom(
    combineLatest([db.itemAppearance(id), db.weaponAppearance(id), db.instrumentAppearance(id)])
  )
  const item = items.find((it) => !!it)
  if (!item) {
    router.navigate(['transmog', TRANSMOG_CATEGORIES[0].id])
    return false
  }

  const cat = TRANSMOG_CATEGORIES.find((it) => matchTransmogCateogry(it, item))
  if (!cat) {
    router.navigate(['transmog', TRANSMOG_CATEGORIES[0].id])
    return false
  }

  router.navigate(['transmog', cat.id, id])
  return false
}
