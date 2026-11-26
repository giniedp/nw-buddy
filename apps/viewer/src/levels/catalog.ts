/**
 * The levels the viewer can open, grouped for the scenes dialog, and the default scene. Built from the game data
 * only, nothing is hard coded by name: another game version brings its own levels.
 *
 * Sources:
 * - `/levels/list.json`: the coatlicues (`sharedassets/coatlicue/<name>`) and their level folders (`levels/<name>`)
 * - `GameModeData` / `GameModeMapData` datasheets: the game mode maps, their category, names, images, memory
 * - `ScheduleData` (`javelindata_schedules`): the main menu level of a season (`MainMenuOverride`)
 * - localization strings for the display names
 *
 * Pure: {@link buildLevelCatalog} takes the parsed data, the loading is in `load.ts`.
 */

import type { LevelIndex } from '../api/types'
import { PLAYER_EYE_HEIGHT } from '../constants'

export type LevelCategory = 'levels' | 'expeditions' | 'soul-trials' | 'season-trials' | 'raids' | 'activities'

/**
 * The groups of the scenes dialog, in this order. The game mode groups follow nw-buddy's game modes page.
 */
export const LEVEL_CATEGORIES: ReadonlyArray<{ id: LevelCategory; label: string }> = [
  { id: 'levels', label: 'Levels' },
  { id: 'expeditions', label: 'Expeditions' },
  { id: 'soul-trials', label: 'Soul Trials' },
  { id: 'season-trials', label: 'Season Trials' },
  { id: 'raids', label: 'Raids' },
  { id: 'activities', label: 'Activities' },
]

/**
 * Coatlicues of at least this projected memory are marked large: the open world and its game modes, raids
 */
export const LARGE_LEVEL_MB = 1024

/**
 * A datasheet row by column name, empty cells left out
 */
export type SheetRow = Record<string, string | number | boolean>

export interface LevelCamera {
  x: number
  y: number
  z: number
  /**
   * Heading in degrees, as the `w` url parameter
   */
  w: number
}

export interface LevelEntry {
  /**
   * Unique within the catalog: the game mode map id, or `level:<coatlicue>` / `menu:<level folder>`
   */
  id: string
  category: LevelCategory
  title: string
  subtitle: string
  /**
   * The `level` url parameter
   */
  coatlicue: string
  /**
   * The `mission` url parameter: the level folder when it differs from the coatlicue, else null
   */
  mission: string | null
  /**
   * Where the camera starts. Null starts at the level's own camera placement, if it has one.
   */
  camera: LevelCamera | null
  /**
   * Archive path of a picture (as the data names it, `.png` for a `.dds`), null for none
   */
  image: string | null
  /**
   * Archive path of an icon, shown when there is no picture
   */
  icon: string | null
  /**
   * Projected memory of the coatlicue in MB: the largest `ProjectedMemoryUseMb` of its maps, 0 if unknown
   */
  memoryMb: number
  large: boolean
  requiredLevel: number
  /**
   * A main menu level of the schedules, `active` for the one of today
   */
  mainMenu?: { active: boolean }
}

export interface LevelCatalog {
  entries: LevelEntry[]
  /**
   * The scene opened when the url names none: the main menu of today, else the smallest scene. Null without any.
   */
  defaultEntry: LevelEntry | null
}

export interface LevelCatalogData {
  index: LevelIndex
  /**
   * `GameModeData` rows
   */
  modes: SheetRow[]
  /**
   * `GameModeMapData` rows
   */
  maps: SheetRow[]
  /**
   * `ScheduleData` rows
   */
  schedules: SheetRow[]
  /**
   * Localization, keyed by the lowercase key without `@`
   */
  strings: ReadonlyMap<string, string>
}

export interface MainMenu {
  scheduleId: string
  /**
   * Level folder (`levels/<level>`), lowercase
   */
  level: string
  coatlicue: string
  title: string
  active: boolean
}

/**
 * The main menu levels of the schedules (`MainMenuOverride` + `MainMenuCoatOverride`), the one to show today first:
 * - the rows active at `now` (UTC), the latest start first
 * - else the row that ended last (the most recent menu)
 * - rows without dates (switched by the server) only when no row has dates
 *
 * The base menu without an override is not in the data (see the plan).
 */
export function pickMainMenus(schedules: readonly SheetRow[], now: Date): MainMenu[] {
  const time = now.getTime()
  const rows = schedules
    .filter((row) => str(row.MainMenuOverride) && str(row.MainMenuCoatOverride))
    .map((row) => {
      const start = scheduleTime(str(row.StartDate))
      const end = scheduleTime(str(row.EndDate))
      const menu: MainMenu = {
        scheduleId: str(row.ScheduleId),
        level: normalizeName(str(row.MainMenuOverride)),
        coatlicue: coatlicueName(str(row.MainMenuCoatOverride)),
        title: str(row.Comments) || str(row.ScheduleId),
        active: false,
      }
      return {
        menu,
        start,
        end,
        dated: start != null || end != null,
      }
    })
  const dated = rows.filter((it) => it.dated)
  const active = dated
    .filter((it) => (it.start ?? -Infinity) <= time && time <= (it.end ?? Infinity))
    .sort((a, b) => (b.start ?? -Infinity) - (a.start ?? -Infinity))
  let first = active[0]
  if (first) {
    first.menu.active = true
  } else if (dated.length) {
    first = [...dated].sort((a, b) => (b.end ?? b.start ?? 0) - (a.end ?? a.start ?? 0))[0]
  } else {
    first = rows[0]
  }
  return [first, ...rows.filter((it) => it !== first)].filter((it) => !!it).map((it) => it.menu)
}

/**
 * The game mode category of a mode, null for the ones that are not shown (nw-buddy `detectCategory`)
 */
export function gameModeCategory(mode: SheetRow | undefined): LevelCategory | null {
  if (!mode) {
    return null
  }
  const id = str(mode.GameModeId).toLowerCase()
  if (id === 'mutation' || id === 'dungeon') {
    // dummies without a map of their own
    return null
  }
  if (mode.IsSoloTrial) {
    return 'soul-trials'
  }
  if (mode.IsSeasonTrial) {
    return 'season-trials'
  }
  if (mode.IsRaidTrial) {
    return 'raids'
  }
  if (mode.IsDungeon) {
    return 'expeditions'
  }
  if (str(mode.ActivityType)) {
    return 'activities'
  }
  return null
}

export function buildLevelCatalog(data: LevelCatalogData, now: Date): LevelCatalog {
  const text = (key: unknown) => localize(data.strings, str(key))
  const coatlicues = new Map(data.index.coatlicues.map((it) => [it.name.toLowerCase(), it]))
  const modes = new Map(data.modes.map((it) => [str(it.GameModeId).toLowerCase(), it]))

  // the size of a coatlicue: the largest projected memory of its maps
  const memory = new Map<string, number>()
  for (const map of data.maps) {
    const coatlicue = coatlicueName(str(map.CoatlicueName))
    memory.set(coatlicue, Math.max(memory.get(coatlicue) ?? 0, num(map.ProjectedMemoryUseMb)))
  }
  const sizeOf = (coatlicue: string) => memory.get(coatlicue) ?? 0

  const entries: LevelEntry[] = []
  const firstTeleport = new Map<string, LevelCamera>()
  // the levels group shows the picture of the first map on the coatlicue
  const firstPicture = new Map<string, { image: string | null; icon: string | null }>()

  for (const map of data.maps) {
    const coatlicue = coatlicueName(str(map.CoatlicueName))
    const mode = modes.get(str(map.GameModeId).toLowerCase())
    const category = gameModeCategory(mode)
    if (!category || !coatlicues.has(coatlicue)) {
      continue
    }
    const camera = parseTeleport(str(map.TeamTeleportData))
    if (camera) {
      camera.z += PLAYER_EYE_HEIGHT
      if (!firstTeleport.has(coatlicue)) {
        firstTeleport.set(coatlicue, camera)
      }
    }
    const modeName = text(mode.DisplayName) || str(mode.GameModeId)
    const mapName = text(map.UIMapDisplayName)
    const image =
      imagePath(map.ActivityScreenBgPath) ?? imagePath(mode.BackgroundImagePath) ?? imagePath(mode.SimpleImagePath)
    const icon = imagePath(mode.IconPath)
    if ((image || icon) && !firstPicture.has(coatlicue)) {
      firstPicture.set(coatlicue, { image, icon })
    }
    entries.push({
      id: str(map.GameModeMapId),
      category,
      title: mapName || modeName,
      subtitle: mapName ? modeName : coatlicue,
      coatlicue,
      mission: null,
      camera,
      image,
      icon,
      memoryMb: sizeOf(coatlicue),
      large: sizeOf(coatlicue) >= LARGE_LEVEL_MB,
      requiredLevel: num(mode.RequiredLevel),
    })
  }

  // every coatlicue with a level folder, once, also the ones without a game mode (FTUE, frontend, …)
  for (const item of data.index.coatlicues) {
    if (!item.level) {
      continue
    }
    const coatlicue = item.name.toLowerCase()
    entries.push({
      id: `level:${coatlicue}`,
      category: 'levels',
      title: coatlicue,
      subtitle: item.level !== item.name ? item.level : levelSummary(item.maps.length),
      coatlicue,
      mission: null,
      camera: firstTeleport.get(coatlicue) ?? null,
      image: firstPicture.get(coatlicue)?.image ?? null,
      icon: firstPicture.get(coatlicue)?.icon ?? null,
      memoryMb: sizeOf(coatlicue),
      large: sizeOf(coatlicue) >= LARGE_LEVEL_MB,
      requiredLevel: 0,
    })
  }

  // the main menus: a level folder on another coatlicue, the camera is the menu's own placement
  const levelFolders = new Set(data.index.levels.map((it) => it.name.toLowerCase()))
  const menus = pickMainMenus(data.schedules, now).filter(
    (it) => coatlicues.has(it.coatlicue) && levelFolders.has(it.level),
  )
  for (const menu of menus) {
    entries.push({
      id: `menu:${menu.level}`,
      category: 'levels',
      title: menu.title,
      subtitle: `main menu, ${menu.level}`,
      coatlicue: menu.coatlicue,
      mission: menu.level === menu.coatlicue ? null : menu.level,
      camera: null,
      image: null,
      icon: null,
      memoryMb: sizeOf(menu.coatlicue),
      large: sizeOf(menu.coatlicue) >= LARGE_LEVEL_MB,
      requiredLevel: 0,
      mainMenu: { active: menu.active },
    })
  }

  entries.sort(compareEntries)
  return { entries, defaultEntry: pickDefault(entries, menus) }
}

/**
 * The main menu of today (or the most recent one), else the smallest scene: the game mode map on the coatlicue with
 * the least projected memory, then the smallest name. Open world quests are not small: their coatlicue is the world.
 */
function pickDefault(entries: readonly LevelEntry[], menus: readonly MainMenu[]): LevelEntry | null {
  const menu = menus[0] && entries.find((it) => it.id === `menu:${menus[0].level}`)
  if (menu) {
    return menu
  }
  const sized = entries.filter((it) => it.category !== 'levels' && it.memoryMb > 0 && it.camera)
  sized.sort((a, b) => a.memoryMb - b.memoryMb || a.id.localeCompare(b.id))
  return sized[0] ?? entries[0] ?? null
}

function compareEntries(a: LevelEntry, b: LevelEntry) {
  const category = categoryOrder(a.category) - categoryOrder(b.category)
  if (category) {
    return category
  }
  // the main menus first, the active one on top
  const menu = menuOrder(a) - menuOrder(b)
  if (menu) {
    return menu
  }
  return a.requiredLevel - b.requiredLevel || a.title.localeCompare(b.title)
}

function categoryOrder(category: LevelCategory) {
  return LEVEL_CATEGORIES.findIndex((it) => it.id === category)
}

function menuOrder(entry: LevelEntry) {
  return entry.mainMenu ? (entry.mainMenu.active ? 0 : 1) : 2
}

function levelSummary(maps: number) {
  if (maps === 1) {
    return '1 game mode map'
  }
  if (maps) {
    return `${maps} game mode maps`
  }
  return 'no game mode'
}

/**
 * The viewer url parameters that open an entry: `level`, `mission` (if any) and the camera `x y z w` (if any; without
 * them the viewer starts at the level's own camera)
 */
export function entryParams(entry: LevelEntry): Record<string, string> {
  const result: Record<string, string> = { level: entry.coatlicue }
  if (entry.mission) {
    result.mission = entry.mission
  }
  if (entry.camera) {
    result.x = String(entry.camera.x)
    result.y = String(entry.camera.y)
    result.z = String(entry.camera.z)
    result.w = String(entry.camera.w)
  }
  return result
}

/**
 * `TeamTeleportData`: `x,y,z,heading` per team, separated by `+`. The first team's.
 */
export function parseTeleport(value: string): LevelCamera | null {
  const parts = value.split('+')[0].split(',').map(Number)
  if (parts.length < 3 || parts.slice(0, 3).some((it) => !Number.isFinite(it))) {
    return null
  }
  return { x: parts[0], y: parts[1], z: parts[2], w: Number.isFinite(parts[3]) ? parts[3] : 0 }
}

/**
 * `coatlicue\NW_Dungeon_Windsward_00` or `coatlicue/Frontend` → `nw_dungeon_windsward_00`, `frontend`
 */
export function coatlicueName(value: string) {
  return normalizeName(value.replace(/^coatlicue[\\/]/i, ''))
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\\/g, '/')
}

/**
 * A localized string for a `@key`, the key without `@` when there is no string, the value itself without `@`
 */
export function localize(strings: ReadonlyMap<string, string>, value: string): string {
  if (!value.startsWith('@')) {
    return value
  }
  const key = value.slice(1)
  return strings.get(key.toLowerCase()) ?? key
}

function imagePath(value: unknown): string | null {
  const path = normalizeName(str(value))
  return path || null
}

/**
 * `2024-06-04T*:*:*` (UTC, `*` for any time) → ms, null for an empty date
 */
function scheduleTime(value: string): number | null {
  if (!value) {
    return null
  }
  const time = Date.parse(`${value.replace(/\*/g, '00')}Z`)
  return Number.isFinite(time) ? time : null
}

function str(value: unknown): string {
  return value == null ? '' : String(value)
}

function num(value: unknown): number {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}
