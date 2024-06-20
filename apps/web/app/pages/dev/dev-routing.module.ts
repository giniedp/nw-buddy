import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { DbFaultsComponent } from './db-faults'
import { DevComponent } from './dev.component'
import { DevLootComponent } from './loottables'
import { DevTesseractComponent } from './tesseract'
import { DevThemeComponent } from './theme/dev-theme.component'
import { PlatformComponent } from './platform/platform.component'

const routes: Routes = [
  {
    path: '',
    component: DevComponent,
    children: [
      {
        path: '',
        redirectTo: 'db-faults',
        pathMatch: 'full',
      },
      {
        path: 'platform',
        component: PlatformComponent,
      },
      {
        path: 'db-faults',
        component: DbFaultsComponent,
      },
      {
        path: 'theme',
        component: DevThemeComponent,
      },
      {
        path: 'tesseract',
        component: DevTesseractComponent,
      },
      {
        path: 'loot',
        component: DevLootComponent,
      },
      {
        path: 'loot/:id',
        component: DevLootComponent,
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevRoutingModule {}
