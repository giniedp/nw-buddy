import { describe, expect, it } from 'vitest'
import type { ListFile, ListResult } from '../../../api/browse'
import { folderNodes } from './AssetTree.store'

const file = (path: string) => ({ path, name: path.split('/').pop() }) as ListFile

describe('folderNodes', () => {
  it('lists the folders with a trailing slash, then the files', () => {
    const listing = { dirs: ['props'], files: [file('objects/a.cgf')], total: 1, truncated: false } as ListResult
    expect(folderNodes('objects', listing).map((it) => [it.kind, it.id, it.name])).toEqual([
      ['dir', 'objects/props/', 'props'],
      ['file', 'objects/a.cgf', 'a.cgf'],
    ])
  })

  it('has no prefix at the root', () => {
    const listing = { dirs: ['objects'], files: [], total: 0, truncated: false } as ListResult
    expect(folderNodes('', listing)[0].id).toBe('objects/')
  })

  it('tells how many files the server left out', () => {
    const listing = { dirs: [], files: [file('a/b.dds')], total: 1001, truncated: true } as ListResult
    const note = folderNodes('a', listing).at(-1)
    expect(note?.kind).toBe('note')
    expect(note?.name).toBe(`… ${(1000).toLocaleString()} more, use the search`)
  })
})
