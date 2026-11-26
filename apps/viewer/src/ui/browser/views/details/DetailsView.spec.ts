import { describe, expect, it } from 'vitest'
import type { DdsPart, FileStat } from '../../../../api/browse'
import { assetId, catalogRows, fileRows, partRow } from './DetailsView.store'

const part = (mip: number, alpha = false): DdsPart => ({
  path: `textures/a/x.dds.${mip}${alpha ? 'a' : ''}`,
  mip,
  alpha,
})

describe('fileRows', () => {
  it('lists what the archive knows, in order', () => {
    const stat = {
      path: 'textures/x.dds',
      size: 2048,
      compressedSize: 1024,
      pak: 'DataStrm-part1.pak',
      crc32: '0x12345678',
      modified: '2025-01-01 12:00:00',
    } as FileStat
    const rows = fileRows({ stat, type: undefined, kind: 'binary' })
    expect(rows.map((it) => it.label)).toEqual([
      'Path',
      'Type',
      'Content',
      'Size',
      'Packed',
      'Pak',
      'CRC32',
      'Modified',
    ])
    expect(rows[1].value).toBe('')
    expect(rows[2].value).toBe('Binary')
    expect(rows[3].value).toMatch(/\(2,048 bytes\)$/)
  })
})

describe('catalog', () => {
  it('has no rows for a file outside the catalog', () => {
    expect(catalogRows(null)).toBeNull()
  })

  it('writes the sub id in hex, only when there is one', () => {
    expect(assetId({ guid: 'abc', subId: 0, type: 't', size: 0 })).toBe('abc')
    expect(assetId({ guid: 'abc', subId: 255, type: 't', size: 0 })).toBe('abc:ff')
  })
})

describe('partRow', () => {
  it('names mips and alpha parts, with the file name', () => {
    expect(partRow(part(3))).toEqual({ label: 'Mip 3', value: 'x.dds.3' })
    expect(partRow(part(2, true)).label).toBe('Alpha mip 2')
    expect(partRow({ path: 'textures/a/x.dds.a', mip: 0, alpha: true })).toEqual({ label: 'Alpha', value: 'x.dds.a' })
  })
})
