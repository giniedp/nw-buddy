import { describe, expect, it } from 'vitest'
import type { ListFile } from '../../../api/browse'
import { folderOf, searchSummary } from './SearchResults.store'

const files = (count: number) => Array.from({ length: count }, () => ({}) as ListFile)

describe('searchSummary', () => {
  it('tells a running and a failed search', () => {
    expect(searchSummary(null, false)).toBe('Searching…')
    expect(searchSummary(null, true)).toBe('The search failed')
  })

  it('counts the matches, and the shown ones of a cut result', () => {
    expect(searchSummary({ files: [], total: 0 }, false)).toBe('No matches')
    expect(searchSummary({ files: files(1), total: 1 }, false)).toBe('1 match')
    expect(searchSummary({ files: files(3), total: 3 }, false)).toBe('3 matches')
    expect(searchSummary({ files: files(2), total: 2000 }, false)).toBe(`2 of ${(2000).toLocaleString()} matches`)
  })
})

describe('folderOf', () => {
  it('is the path without the file name', () => {
    expect(folderOf('objects/props/a.cgf')).toBe('objects/props')
    expect(folderOf('game.cfg')).toBe('')
  })
})
