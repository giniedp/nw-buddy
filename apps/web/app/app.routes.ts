import { Routes } from '@angular/router'
import { landingRedirect } from './landing-redirect'
import { LandingComponent } from './landing.component'
import { PrivacyComponent } from './privacy.component'

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: LandingComponent,
    canActivate: [landingRedirect],
  },
  {
    path: 'privacy',
    pathMatch: 'full',
    component: PrivacyComponent,
  },
  { path: 'ipfs', loadChildren: () => import('./pages/share').then((m) => m.ShareModule) },
  { path: 'abilities', loadChildren: () => import('./pages/database/abilities').then((m) => m.AbilitiesModule) },
  { path: 'crafting', loadChildren: () => import('./pages/database/crafting').then((m) => m.CraftingModule) },
  { path: 'housing', loadChildren: () => import('./pages/database/housing').then((m) => m.HousingModule) },
  { path: 'items', loadChildren: () => import('./pages/database/items').then((m) => m.ItemsModule) },
  { path: 'perks', loadChildren: () => import('./pages/database/perks').then((m) => m.PerksModule) },
  { path: 'poi', loadChildren: () => import('./pages/database/poi').then((m) => m.PoiModule) },
  { path: 'quests', loadChildren: () => import('./pages/database/quests').then((m) => m.QuestsModule) },
  { path: 'loot', loadChildren: () => import('./pages/database/loot').then((m) => m.LootModule) },
  { path: 'damage', loadChildren: () => import('./pages/database/damage').then((m) => m.DamageModule) },
  { path: 'game-events', loadChildren: () => import('./pages/database/game-events').then((m) => m.GameEventsModule) },
  {
    path: 'status-effects',
    loadChildren: () => import('./pages/database/status-effects').then((m) => m.StatusEffectsModule),
  },
  { path: 'vitals', loadChildren: () => import('./pages/database/vitals').then((m) => m.VitalsModule) },
  { path: 'loot-limits', loadChildren: () => import('./pages/database/loot-limits').then((m) => m.LootLimitsModule) },

  { path: 'armorsets', loadChildren: () => import('./pages/tools/armorsets').then((m) => m.ArmorsetsModule) },
  { path: 'dungeons', redirectTo: 'game-modes' },
  { path: 'game-modes', loadChildren: () => import('./pages/tools/game-modes').then((m) => m.GameModesModule) },
  { path: 'inventory', loadChildren: () => import('./pages/tools/inventory').then((m) => m.InventoryModule) },
  { path: 'gearsets', loadChildren: () => import('./pages/tools/gearsets').then((m) => m.GearsetsModule) },
  { path: 'skill-trees', loadChildren: () => import('./pages/tools/skill-trees').then((m) => m.SkillTreesModule) },
  { path: 'transmog', loadChildren: () => import('./pages/tools/transmog').then((m) => m.TransmogModule) },
  { path: 'mounts', loadChildren: () => import('./pages/tools/mounts').then((m) => m.MountModule) },
  { path: 'info-cards', loadChildren: () => import('./pages/tools/info-cards').then((m) => m.InfoCardsModule) },
  { path: 'level-xp', loadChildren: () => import('./pages/tools/level-xp').then((m) => m.LevelXpModule) },
  { path: 'territories', loadChildren: () => import('./pages/tools/territories').then((m) => m.TerritoriesModule) },
  { path: 'leveling', loadChildren: () => import('./pages/tools/leveling').then((m) => m.LevelingModule) },

  { path: 'dev', loadChildren: () => import('./pages/dev/dev.module').then((m) => m.DevModule) },
  { path: 'links', loadChildren: () => import('./pages/misc/links').then((m) => m.LinksModule) },
  { path: 'about', loadChildren: () => import('./pages/misc/about').then((m) => m.AboutModule) },
  { path: 'preferences', loadChildren: () => import('./pages/misc/preferences').then((m) => m.PreferencesModule) },

  { path: '**', loadChildren: () => import('./pages/misc/not-found').then((m) => m.NotFoundModule) },
]
