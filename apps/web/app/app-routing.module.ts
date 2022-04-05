import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home').then((m) => m.HomeModule)
  },
  { path: 'character', loadChildren: () => import('./pages/character').then((m) => m.CharacterModule) },
  { path: 'browser', loadChildren: () => import('./pages/browser').then((m) => m.BrowserModule) },
  { path: 'items', loadChildren: () => import('./pages/items/items.module').then(m => m.ItemsModule) },
  { path: 'armorsets', loadChildren: () => import('./pages/armorsets').then(m => m.SetsModule) },
  { path: 'xp', loadChildren: () => import('./pages/xp/xp.module').then(m => m.XpModule) },
  { path: 'trophies', loadChildren: () => import('./pages/trophies/trophies.module').then(m => m.TrophiesModule) },
  { path: '**', loadChildren: () => import('./pages/not-found').then((m) => m.NotFoundModule) },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, {  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
