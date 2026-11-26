import { describe, expect, it } from 'vitest'
import type { ChunkEntry, ChunkFile } from '../../../../formats/cgf/chunks'
import { describeFile } from './InspectMode.store'

const chunk = (index: number): ChunkEntry => ({
  index,
  type: 0,
  typeName: 'Node',
  version: 0x824,
  id: index + 1,
  offset: 0,
  size: 0,
})

const chunks = (count: number): ChunkFile => ({
  signature: 'CrCh',
  version: 0x746,
  tableOffset: 0,
  chunks: Array.from({ length: count }, (_, i) => chunk(i)),
})

describe('describeFile', () => {
  it('tells signature, version, chunks and size', () => {
    expect(describeFile({ chunks: chunks(3), heapPath: null, heapSize: 0 }, 2048)).toBe(
      'CrCh 0x746 · 3 chunks · 2.0 KiB',
    )
  })

  it('adds the heap of a model', () => {
    expect(describeFile({ chunks: chunks(1), heapPath: 'a.cgfheap', heapSize: 512 }, 100)).toBe(
      'CrCh 0x746 · 1 chunks · 100 B · heap 512 B',
    )
  })
})
