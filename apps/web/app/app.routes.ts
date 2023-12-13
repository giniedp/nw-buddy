import { Routes } from '@angular/router'
import { landingRedirect } from './landing-redirect'
import { LandingComponent } from './landing.component'
import { PrivacyComponent } from './privacy.component'

const routes: Routes = [
  { path: 'ipfs', loadChildren: () => import('./pages/share').then((m) => m.ShareModule) },

  { path: 'abilities', loadChildren: () => import('./pages/database/abilities').then((m) => m.AbilitiesPageModule) },
  {
    path: 'gatherables',
    loadChildren: () => import('./pages/database/gatherables').then((m) => m.GatherablesPageModule),
  },
  { path: 'crafting', loadChildren: () => import('./pages/database/crafting').then((m) => m.CraftingPageModule) },
  { path: 'housing', loadChildren: () => import('./pages/database/housing').then((m) => m.HousingPageModule) },
  { path: 'items', loadChildren: () => import('./pages/database/items').then((m) => m.ItemsPageModule) },
  { path: 'perks', loadChildren: () => import('./pages/database/perks').then((m) => m.PerksPageModule) },
  { path: 'poi', loadChildren: () => import('./pages/database/poi').then((m) => m.PoiPageModule) },
  { path: 'quests', loadChildren: () => import('./pages/database/quests').then((m) => m.QuestsPageModule) },
  { path: 'loot', loadChildren: () => import('./pages/database/loot').then((m) => m.LootPageModule) },
  { path: 'damage', loadChildren: () => import('./pages/database/damage').then((m) => m.DamagePageModule) },
  {
    path: 'backstories',
    loadChildren: () => import('./pages/database/backstories').then((m) => m.BackstoriesPageModule),
  },
  {
    path: 'season-pass',
    loadChildren: () => import('./pages/database/season-pass').then((m) => m.SeasonPassPageModule),
  },
  { path: 'emotes', loadChildren: () => import('./pages/database/emotes').then((m) => m.EmotesPageModule) },
  {
    path: 'player-titles',
    loadChildren: () => import('./pages/database/player-titles').then((m) => m.PlayerTitlesPageModule),
  },
  {
    path: 'game-events',
    loadChildren: () => import('./pages/database/game-events').then((m) => m.GameEventsPageModule),
  },
  {
    path: 'status-effects',
    loadChildren: () => import('./pages/database/status-effects').then((m) => m.StatusEffectsPageModule),
  },
  { path: 'vitals', loadChildren: () => import('./pages/database/vitals').then((m) => m.VitalsPageModule) },
  {
    path: 'loot-limits',
    loadChildren: () => import('./pages/database/loot-limits').then((m) => m.LootLimitsPageModule),
  },
  {
    path: 'loot-buckets',
    loadChildren: () => import('./pages/database/loot-buckets').then((m) => m.LootBucketsPageModule),
  },
  { path: 'armorsets', redirectTo: 'armor-sets' },
  { path: 'armor-sets', loadChildren: () => import('./pages/tools/armorsets').then((m) => m.ArmorsetsModule) },
  {
    path: 'armor-weights',
    loadChildren: () => import('./pages/tools/armor-weights').then((m) => m.ArmorWeightsModule),
  },
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

  {
    path: 'tracking',
    children: [
      {
        path: 'schematics',
        loadChildren: () => import('./pages/tracking/schematics').then((m) => m.SchematicPageModule),
      },
      {
        path: 'runes',
        loadChildren: () => import('./pages/tracking/runes').then((m) => m.RunesPageModule),
      },
      {
        path: 'trophies',
        loadChildren: () => import('./pages/tracking/trophies').then((m) => m.TrophiesPageModule),
      },
      {
        path: 'recipes',
        loadChildren: () => import('./pages/tracking/recipes').then((m) => m.RecipesPageModule),
      },
      {
        path: 'music-sheets',
        loadChildren: () => import('./pages/tracking/music-sheets').then((m) => m.MusicPageModule),
      },
      {
        path: 'artifacts',
        loadChildren: () => import('./pages/tracking/artifacts').then((m) => m.ArtifactsPageModule),
      },
    ],
  },
]

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

  {
    path: '',
    children: routes,
  },
  // {
  //   path: 'archive',
  //   component: ArchiveComponent,
  //   children: [
  //     {
  //       path: '',
  //       outlet: 'v',
  //       component: LayoutColComponent,
  //       children: [
  //         {
  //           path: ':version',
  //           canActivate: [NwDataInterceptor.activateVersionGuard('version')],
  //           children: routes,
  //         },
  //       ],
  //     },
  //   ],
  // },

  { path: '**', loadChildren: () => import('./pages/misc/not-found').then((m) => m.NotFoundModule) },
]
