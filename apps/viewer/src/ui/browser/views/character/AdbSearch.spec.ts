import { describe, expect, it } from 'vitest'
import type { CharacterDatabase } from '../../../../api'
import { compareDatabases, searchDatabases } from './AdbSearch.store'

const db = (file: string, playable = 0, fragments = 0): CharacterDatabase => ({ file, playable, fragments })

describe('compareDatabases', () => {
  it('puts the most playable first, then sorts by path', () => {
    const list = [db('b.adb'), db('c.adb', 2, 5), db('a.adb'), db('d.adb', 7, 9)]
    expect(list.sort(compareDatabases).map((it) => it.file)).toEqual(['d.adb', 'c.adb', 'a.adb', 'b.adb'])
  })
})

describe('searchDatabases', () => {
  const list = [db('adb/player/male_sword.adb'), db('adb/player/female_bow.adb'), db('adb/npc/wolf.adb')]

  it('matches every word of the query, case ignored', () => {
    expect(searchDatabases(list, 'PLAYER sword').map((it) => it.file)).toEqual(['adb/player/male_sword.adb'])
    expect(searchDatabases(list, 'player').length).toBe(2)
  })

  it('returns all databases for an empty query', () => {
    expect(searchDatabases(list, '  ')).toBe(list)
  })
})
