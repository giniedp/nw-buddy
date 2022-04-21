import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'items'
  },
  { path: 'character', loadChildren: () => import('./pages/character').then((m) => m.CharacterModule) },
  { path: 'items', loadChildren: () => import('./pages/items').then(m => m.ItemsModule) },
  { path: 'perks', loadChildren: () => import('./pages/perks').then(m => m.PerksModule) },
  { path: 'armorsets', loadChildren: () => import('./pages/armorsets').then(m => m.ArmorsetsModule) },
  { path: 'status-effects', loadChildren: () => import('./pages/status-effects').then(m => m.StatusEffectsModule) },
  { path: 'xp', loadChildren: () => import('./pages/xp/xp.module').then(m => m.XpModule) },
  { path: 'dungeons', loadChildren: () => import('./pages/dungeons/dungeons.module').then(m => m.DungeonsModule) },
  { path: 'abilities', loadChildren: () => import('./pages/abilities/abilities.module').then(m => m.AbilitiesModule) },
  { path: 'housing', loadChildren: () => import('./pages/housing/housing.module').then(m => m.HousingModule) },
  { path: 'crafting', loadChildren: () => import('./pages/crafting/crafting.module').then(m => m.CraftingModule) },

  { path: '**', loadChildren: () => import('./pages/not-found').then((m) => m.NotFoundModule) },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, {  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
