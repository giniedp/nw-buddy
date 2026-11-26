import { describe, expect, it } from 'vitest'
import type { LevelIndex } from '../api/types'
import { PLAYER_EYE_HEIGHT } from '../constants'
import {
  buildLevelCatalog,
  coatlicueName,
  gameModeCategory,
  localize,
  parseTeleport,
  pickMainMenus,
  type LevelCatalogData,
  type SheetRow,
} from './catalog'

const index: LevelIndex = {
  levels: [
    { name: 'world', coatlicueNames: ['world'] },
    { name: 'dungeon_a', coatlicueNames: ['dungeon_a'] },
    { name: 'tiny', coatlicueNames: ['tiny'] },
    { name: 'menu_v2', coatlicueNames: ['menu_base'] },
    { name: 'ftue', coatlicueNames: ['ftue'] },
  ],
  coatlicues: [
    { name: 'world', level: 'world', maps: [] },
    { name: 'dungeon_a', level: 'dungeon_a', maps: [] },
    { name: 'tiny', level: 'tiny', maps: [] },
    { name: 'menu_base', level: '', maps: [] },
    { name: 'ftue', level: 'ftue', maps: [] },
  ],
}

const modes: SheetRow[] = [
  { GameModeId: 'Dungeon', DisplayName: '@dummy', IsDungeon: true, ActivityType: 'Dungeon' },
  { GameModeId: 'DungeonA', DisplayName: '@dungeon_a_title', IsDungeon: true, RequiredLevel: 30 },
  { GameModeId: 'QuestTiny', DisplayName: '@quest_tiny', IsDungeon: true, IsSoloTrial: true },
  { GameModeId: 'QuestWorld', DisplayName: '@quest_world', IsDungeon: true, IsSoloTrial: true },
  { GameModeId: 'Raid', DisplayName: '@raid', IsDungeon: true, IsRaidTrial: true },
  { GameModeId: 'Season', DisplayName: '@season', IsDungeon: true, IsSeasonTrial: true, IsRaidTrial: true },
  { GameModeId: 'Arena', DisplayName: '@arena', ActivityType: 'Arena', IconPath: 'Icons/Arena.png' },
  { GameModeId: 'Test', DisplayName: '@test' },
]

const maps: SheetRow[] = [
  { GameModeMapId: 'Dungeon', GameModeId: 'Dungeon' },
  {
    GameModeMapId: 'DungeonA',
    GameModeId: 'DungeonA',
    CoatlicueName: 'coatlicue\\Dungeon_A',
    TeamTeleportData: '10,20,30,90+1,2,3,0',
    ProjectedMemoryUseMb: 512,
  },
  {
    GameModeMapId: 'QuestTiny',
    GameModeId: 'QuestTiny',
    CoatlicueName: 'coatlicue\\Tiny',
    TeamTeleportData: '1,2,3',
    ProjectedMemoryUseMb: 50,
  },
  {
    GameModeMapId: 'QuestWorld',
    GameModeId: 'QuestWorld',
    CoatlicueName: 'coatlicue\\World',
    TeamTeleportData: '5,5,5,0',
    ProjectedMemoryUseMb: 40,
  },
  { GameModeMapId: 'Raid', GameModeId: 'Raid', CoatlicueName: 'coatlicue\\World', ProjectedMemoryUseMb: 1024 },
  { GameModeMapId: 'Season', GameModeId: 'Season', CoatlicueName: 'coatlicue\\Dungeon_A', ProjectedMemoryUseMb: 100 },
  {
    GameModeMapId: 'Arena_02',
    GameModeId: 'Arena',
    CoatlicueName: 'coatlicue\\Dungeon_A',
    UIMapDisplayName: '@arena_02_map',
    ActivityScreenBgPath: 'LyShineUI\\Images\\Arena02.png',
  },
  { GameModeMapId: 'Test', GameModeId: 'Test', CoatlicueName: 'coatlicue\\Tiny' },
  { GameModeMapId: 'Missing', GameModeId: 'DungeonA', CoatlicueName: 'coatlicue\\Gone' },
]

const strings = new Map([
  ['dungeon_a_title', 'Amrine'],
  ['quest_tiny', 'Tiny Trial'],
  ['arena', 'Arena 3v3'],
  ['arena_02_map', 'Ancient Sanctum'],
])

const menuRow = (id: string, start: string | null, end: string | null, level = 'Menu_V2'): SheetRow => ({
  ScheduleId: id,
  ...(start ? { StartDate: start } : {}),
  ...(end ? { EndDate: end } : {}),
  MainMenuOverride: level,
  MainMenuCoatOverride: 'coatlicue/Menu_Base',
  Comments: `${id} menu`,
})

const now = new Date(Date.UTC(2026, 10, 11))

function data(overrides: Partial<LevelCatalogData> = {}): LevelCatalogData {
  return { index, modes, maps, schedules: [], strings, ...overrides }
}

describe('level catalog', () => {
  it('categorizes like nw-buddy, in its order of checks', () => {
    const category = (id: string) => gameModeCategory(modes.find((it) => it.GameModeId === id))
    expect(category('Dungeon')).toBe(null)
    expect(category('DungeonA')).toBe('expeditions')
    expect(category('QuestTiny')).toBe('soul-trials')
    expect(category('Season')).toBe('season-trials')
    expect(category('Raid')).toBe('raids')
    expect(category('Arena')).toBe('activities')
    expect(category('Test')).toBe(null)
  })

  it('joins maps, modes, coatlicues and strings', () => {
    const { entries } = buildLevelCatalog(data(), now)
    const byId = new Map(entries.map((it) => [it.id, it]))
    expect([...byId.keys()]).not.toContain('Dungeon')
    expect([...byId.keys()]).not.toContain('Test')
    expect([...byId.keys()]).not.toContain('Missing')

    expect(byId.get('DungeonA')).toMatchObject({
      category: 'expeditions',
      title: 'Amrine',
      subtitle: 'dungeon_a',
      coatlicue: 'dungeon_a',
      mission: null,
      // the teleport at eye height
      camera: { x: 10, y: 20, z: 30 + PLAYER_EYE_HEIGHT, w: 90 },
      memoryMb: 512,
      large: false,
      requiredLevel: 30,
    })
    // a map name: the map is the title, the mode the subtitle, the map picture
    expect(byId.get('Arena_02')).toMatchObject({
      title: 'Ancient Sanctum',
      subtitle: 'Arena 3v3',
      image: 'lyshineui/images/arena02.png',
      icon: 'icons/arena.png',
    })
    // a key without a string shows the key
    expect(byId.get('Raid')?.title).toBe('raid')
    // the coatlicue's size is its largest map: an open world quest is large
    expect(byId.get('QuestWorld')).toMatchObject({ memoryMb: 1024, large: true })
  })

  it('lists every coatlicue with a level folder once, with the teleport of its first map', () => {
    const levels = buildLevelCatalog(data(), now).entries.filter((it) => it.category === 'levels')
    expect(levels.map((it) => it.id)).toEqual(['level:dungeon_a', 'level:ftue', 'level:tiny', 'level:world'])
    expect(levels[0].camera).toEqual({ x: 10, y: 20, z: 30 + PLAYER_EYE_HEIGHT, w: 90 })
    // the picture of the first map with one: Arena_02 on dungeon_a
    expect(levels[0]).toMatchObject({ image: 'lyshineui/images/arena02.png', icon: 'icons/arena.png' })
    // no game mode: the level's own camera
    expect(levels[1]).toMatchObject({ camera: null, subtitle: 'no game mode' })
  })

  it('orders groups, then by required level and title', () => {
    const ids = buildLevelCatalog(data(), now)
      .entries.filter((it) => it.category !== 'levels')
      .map((it) => it.id)
    // soul trials by title: 'quest_world' (no string) before 'Tiny Trial'
    expect(ids).toEqual(['DungeonA', 'QuestWorld', 'QuestTiny', 'Season', 'Raid', 'Arena_02'])
  })

  it('defaults to the smallest coatlicue without schedules', () => {
    // QuestWorld is smaller (40) but on the world (1024)
    expect(buildLevelCatalog(data(), now).defaultEntry?.id).toBe('QuestTiny')
  })

  it('defaults to the main menu of today', () => {
    const catalog = buildLevelCatalog(
      data({
        schedules: [
          menuRow('Old', '2024-04-09T*:*:*', '2024-05-01T*:*:*'),
          menuRow('Now', '2025-10-01T*:*:*', '2027-10-01T*:*:*'),
        ],
      }),
      now,
    )
    // menu_v2 is no coatlicue: the menu is the level folder on the coatlicue menu_base
    expect(catalog.defaultEntry).toMatchObject({
      id: 'menu:menu_v2',
      coatlicue: 'menu_base',
      mission: 'menu_v2',
      camera: null,
      title: 'Now menu',
      mainMenu: { active: true },
    })
    expect(catalog.entries[0].id).toBe('menu:menu_v2')
  })

  it('picks the main menu by its dates', () => {
    const spring = menuRow('Spring', '2024-04-09T*:*:*', '2024-05-01T*:*:*')
    const summer = menuRow('Summer', '2024-06-04T*:*:*', '2024-07-02T*:*:*')
    const winter = menuRow('Winter', null, null)
    const long = menuRow('Long', '2025-10-01T*:*:*', '2027-10-01T*:*:*')
    const inside = menuRow('Inside', '2026-11-01T*:*:*', '2026-12-01T*:*:*')
    const ids = (rows: SheetRow[]) => pickMainMenus(rows, now).map((it) => `${it.scheduleId}${it.active ? '*' : ''}`)

    // active rows win, the latest start first
    expect(ids([spring, long, inside, winter])[0]).toBe('Inside*')
    // none active: the one that ended last, not active
    expect(ids([spring, summer, winter])[0]).toBe('Summer')
    // undated rows only without dated ones
    expect(ids([winter])[0]).toBe('Winter')
    // rows without both columns are no menus
    expect(pickMainMenus([{ ScheduleId: 'Quest', StartDate: '2026-01-01T*:*:*' }], now)).toEqual([])
  })

  it('parses names, teleports and strings', () => {
    expect(coatlicueName('coatlicue\\NW_Dungeon_Windsward_00')).toBe('nw_dungeon_windsward_00')
    expect(coatlicueName('coatlicue/Frontend')).toBe('frontend')
    expect(parseTeleport('9281.0,3739.0,231.0,0+1,2,3,4')).toEqual({ x: 9281, y: 3739, z: 231, w: 0 })
    expect(parseTeleport('')).toBe(null)
    expect(localize(strings, '@Arena')).toBe('Arena 3v3')
    expect(localize(strings, 'plain')).toBe('plain')
  })
})
