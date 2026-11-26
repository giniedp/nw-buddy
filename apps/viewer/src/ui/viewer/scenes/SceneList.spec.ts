import { describe, expect, it } from 'vitest'
import type { LevelEntry } from '../../../levels/catalog'
import { groupScenes, sceneTooltip, tabOf } from './SceneList.store'

const entry = (id: string, category: LevelEntry['category'], title: string, coatlicue = id): LevelEntry =>
  ({ id, category, title, subtitle: '', coatlicue, mission: null }) as LevelEntry

const entries = [
  entry('raid', 'raids', 'Hive of Gorgons'),
  entry('level:newworld_vitaeeterna', 'levels', 'Aeternum', 'newworld_vitaeeterna'),
  entry('dungeon', 'expeditions', 'Amrine Excavation', 'nw_dungeon_windsward_00'),
  entry('menu', 'levels', 'Nighthaven'),
]

describe('groupScenes', () => {
  it('groups by category in the order of the categories', () => {
    const groups = groupScenes(entries, '')
    expect(groups.map((it) => it.id)).toEqual(['levels', 'expeditions', 'raids'])
    expect(groups[0].entries.map((it) => it.title)).toEqual(['Aeternum', 'Nighthaven'])
  })

  it('filters by title and coatlicue, case insensitive, and drops empty groups', () => {
    expect(groupScenes(entries, ' AMRINE ').map((it) => it.id)).toEqual(['expeditions'])
    expect(groupScenes(entries, 'windsward')[0].entries[0].id).toBe('dungeon')
    expect(groupScenes(entries, 'nothing matches')).toEqual([])
  })
})

describe('tabOf', () => {
  const groups = groupScenes(entries, '')

  it('is the tab of the category', () => {
    expect(tabOf(groups, 'raids')).toBe(2)
  })

  it('is the first tab for a category without a tab, or none', () => {
    expect(tabOf(groups, 'activities')).toBe(0)
    expect(tabOf(groups, undefined)).toBe(0)
  })
})

describe('sceneTooltip', () => {
  it('names the coatlicue, and the mission when there is one', () => {
    expect(sceneTooltip({ title: 'Aeternum', coatlicue: 'newworld_vitaeeterna', mission: null })).toBe(
      'Aeternum (newworld_vitaeeterna)',
    )
    expect(sceneTooltip({ title: 'Menu', coatlicue: 'nw_frontend', mission: 'nw_frontend_nighthaven' })).toBe(
      'Menu (nw_frontend, nw_frontend_nighthaven)',
    )
  })
})
