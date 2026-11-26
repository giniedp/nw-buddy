import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ViewerAreaSpawnerComponent, ViewerPrefabSpawnerComponent, ViewerSlice } from '../../api'
import {
  ENCOUNTER_CATEGORIES,
  encounterCategory,
  findSkippingRule,
  OTHER_ENCOUNTERS,
  type EncounterCategory,
  type SpawnRuleInput,
} from './spawnRules'

// the tests run on their own categories, the configured ones may change any time
const categories = ENCOUNTER_CATEGORIES as EncounterCategory[]
const configured = [...categories]

beforeEach(() => {
  categories.splice(
    0,
    categories.length,
    { name: 'skipped', pattern: /enc_skipped/i, skip: true },
    { name: 'spawned', pattern: /enc_spawned/i, skip: false },
    { name: 'late', pattern: /enc_/i, skip: true },
  )
})

afterEach(() => {
  categories.splice(0, categories.length, ...configured)
})

describe('encounterCategory', () => {
  it('finds the category by the name, case insensitive', () => {
    expect(encounterCategory('Enc_Skipped_00').name).toBe('skipped')
    expect(encounterCategory('worldevent_enc_spawned_01').name).toBe('spawned')
  })

  it('takes the first match', () => {
    expect(encounterCategory('enc_spawned_enc_skipped').name).toBe('skipped')
    expect(encounterCategory('enc_something').name).toBe('late')
  })

  it('falls back to the other encounters', () => {
    expect(encounterCategory('something_new')).toBe(OTHER_ENCOUNTERS)
  })
})

describe('area-encounter', () => {
  const input = (source: SpawnRuleInput['source'], encounter?: string): SpawnRuleInput => ({
    source,
    parent: null,
    target: { entities: [], spawnRadius: 0, isStaticSlice: false, encounter } as ViewerSlice,
    phase: null,
  })
  const area = { type: 'AreaSpawner' } as unknown as ViewerAreaSpawnerComponent
  const prefab = { type: 'PrefabSpawner' } as unknown as ViewerPrefabSpawnerComponent

  it('leaves out encounters of skipped categories from area spawners', () => {
    expect(findSkippingRule(input(area, 'Enc_Skipped_00'))?.name).toBe('area-encounter')
  })

  it('spawns encounters of the other categories', () => {
    expect(findSkippingRule(input(area, 'Enc_Spawned_00'))).toBeNull()
  })

  it('spawns other slices and encounters of other spawners', () => {
    expect(findSkippingRule(input(area))).toBeNull()
    expect(findSkippingRule(input(prefab, 'Enc_Skipped_00'))).toBeNull()
  })
})
