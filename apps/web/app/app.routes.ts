import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, RouterStateSnapshot, Routes, UrlMatcher } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { catchError, map, of } from 'rxjs'
import { LANG_OPTIONS } from './app-menu'
import { AppComponent } from './app.component'
import { ElectronComponent } from './electron'
import { landingRedirect } from './landing-redirect'
import { LandingComponent } from './landing.component'
import { PrivacyComponent } from './privacy.component'

const PAGE_ROUTES: Routes = [
  { path: 'ipfs', loadChildren: () => import('./pages/share').then((m) => m.ROUTES) },

  { path: 'abilities', loadChildren: () => import('./pages/database/abilities').then((m) => m.ROUTES) },
  { path: 'backstories', loadChildren: () => import('./pages/database/backstories').then((m) => m.ROUTES) },
  { path: 'crafting', loadChildren: () => import('./pages/database/crafting').then((m) => m.ROUTES) },
  { path: 'damage', loadChildren: () => import('./pages/database/damage').then((m) => m.ROUTES) },
  { path: 'emotes', loadChildren: () => import('./pages/database/emotes').then((m) => m.ROUTES) },
  { path: 'game-events', loadChildren: () => import('./pages/database/game-events').then((m) => m.ROUTES) },
  { path: 'gatherables', loadChildren: () => import('./pages/database/gatherables').then((m) => m.ROUTES) },
  { path: 'housing', loadChildren: () => import('./pages/database/housing').then((m) => m.ROUTES) },
  { path: 'items', loadChildren: () => import('./pages/database/items').then((m) => m.ROUTES) },
  { path: 'loot-buckets', loadChildren: () => import('./pages/database/loot-buckets').then((m) => m.ROUTES) },
  { path: 'loot-limits', loadChildren: () => import('./pages/database/loot-limits').then((m) => m.ROUTES) },
  { path: 'loot', loadChildren: () => import('./pages/database/loot').then((m) => m.ROUTES) },
  { path: 'lore', loadChildren: () => import('./pages/database/lore').then((m) => m.ROUTES) },
  { path: 'npcs', loadChildren: () => import('./pages/database/npcs').then((m) => m.ROUTES) },
  { path: 'perks', loadChildren: () => import('./pages/database/perks').then((m) => m.ROUTES) },
  { path: 'player-titles', loadChildren: () => import('./pages/database/player-titles').then((m) => m.ROUTES) },
  { path: 'pvp-buckets', loadChildren: () => import('./pages/database/pvp-buckets').then((m) => m.ROUTES) },
  { path: 'pvp-ranks', loadChildren: () => import('./pages/database/pvp-ranks').then((m) => m.ROUTES) },
  { path: 'quests', loadChildren: () => import('./pages/database/quests').then((m) => m.ROUTES) },
  { path: 'season-pass', loadChildren: () => import('./pages/database/season-pass').then((m) => m.ROUTES) },
  { path: 'spells', loadChildren: () => import('./pages/database/spells').then((m) => m.ROUTES) },
  { path: 'status-effects', loadChildren: () => import('./pages/database/status-effects').then((m) => m.ROUTES) },
  { path: 'vitals', loadChildren: () => import('./pages/database/vitals').then((m) => m.ROUTES) },
  { path: 'zones', loadChildren: () => import('./pages/database/zones').then((m) => m.ROUTES) },
  { path: 'armorsets', redirectTo: 'armor-sets' }, // deprecated
  { path: 'armor-sets', loadChildren: () => import('./pages/tools/armorsets').then((m) => m.ROUTES) },
  { path: 'armor-weights', loadChildren: () => import('./pages/tools/armor-weights').then((m) => m.ROUTES) },
  { path: 'dungeons', redirectTo: 'game-modes' },
  { path: 'game-modes', loadChildren: () => import('./pages/tools/game-modes').then((m) => m.ROUTES) },
  { path: 'inventory', loadChildren: () => import('./pages/tools/inventory').then((m) => m.ROUTES) },
  { path: 'gearsets', loadChildren: () => import('./pages/tools/gearsets').then((m) => m.ROUTES) },
  { path: 'skill-trees', loadChildren: () => import('./pages/tools/skill-trees').then((m) => m.ROUTES) },
  { path: 'transmog', loadChildren: () => import('./pages/tools/transmog').then((m) => m.ROUTES) },
  { path: 'mounts', loadChildren: () => import('./pages/tools/mounts').then((m) => m.ROUTES) },

  { path: 'territories', loadChildren: () => import('./pages/tools/territories').then((m) => m.ROUTES) },
  { path: 'leveling', loadChildren: () => import('./pages/tools/leveling').then((m) => m.ROUTES) },

  // { path: 'dev', loadChildren: () => import('./pages/dev/dev.module').then((m) => m.DevModule) },
  { path: 'links', loadChildren: () => import('./pages/misc/links').then((m) => m.ROUTES) },
  { path: 'about', loadChildren: () => import('./pages/misc/about').then((m) => m.ROUTES) },
  { path: 'preferences', loadChildren: () => import('./pages/misc/preferences').then((m) => m.ROUTES) },

  { path: 'damage-calculator', loadChildren: () => import('./pages/tools/damage-calculator').then((m) => m.ROUTES) },

  {
    path: 'tracking',
    children: [
      { path: 'schematics', loadChildren: () => import('./pages/tracking/schematics').then((m) => m.ROUTES) },
      { path: 'runes', loadChildren: () => import('./pages/tracking/runes').then((m) => m.ROUTES) },
      { path: 'trophies', loadChildren: () => import('./pages/tracking/trophies').then((m) => m.ROUTES) },
      { path: 'recipes', loadChildren: () => import('./pages/tracking/recipes').then((m) => m.ROUTES) },
      { path: 'music-sheets', loadChildren: () => import('./pages/tracking/music-sheets').then((m) => m.ROUTES) },
      { path: 'artifacts', loadChildren: () => import('./pages/tracking/artifacts').then((m) => m.ROUTES) },
    ],
  },
]

export const APP_ROUTES: Routes = [
  {
    path: 'electron',
    pathMatch: 'full',
    component: ElectronComponent,
  },
  {
    matcher: localeRouteMatcher(LANG_OPTIONS.map((it) => it.value)),
    canActivate: [loadLocaleFn],
    component: AppComponent,
    children: [
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
        children: PAGE_ROUTES,
      },
      { path: '**', loadChildren: () => import('./pages/misc/not-found').then((m) => m.NotFoundModule) },
    ],
  },
]

export function localeRouteMatcher(knownLocales: string[]): UrlMatcher {
  return (url) => {
    const token = url[0]?.path?.toLowerCase()
    if (!knownLocales.includes(token)) {
      return {
        consumed: [],
        posParams: {},
      }
    }
    return {
      consumed: [url[0]],
      posParams: {
        locale: url[0],
      },
    }
  }
}

export function loadLocaleFn(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
  const locale = route.params['locale'] || 'en-us'
  return inject(TranslateService)
    .use(locale)
    .pipe(
      catchError(() => of(true)),
      map(() => true),
    )
}
