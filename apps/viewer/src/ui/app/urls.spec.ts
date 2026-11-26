import { describe, expect, it } from 'vitest'
import { browserHref, dataHref, pathSegment, segmentValue } from './urls'

describe('urls', () => {
  it('encodes parentheses in path segments (Angular reads them as outlets)', () => {
    expect(pathSegment('Foo(1)')).toBe('Foo%281%29')
    expect(dataHref('Foo(1)', 'a b')).toBe('/data/Foo%281%29?key=a%20b')
    expect(dataHref('ItemData')).toBe('/data/ItemData')
  })

  it('keeps file paths in the query', () => {
    expect(browserHref('objects/a b.cgf')).toBe('/browser?file=objects%2Fa%20b.cgf')
  })

  it('decodes a route param, and leaves a broken one as it is', () => {
    expect(segmentValue('Foo%281%29')).toBe('Foo(1)')
    expect(segmentValue('%E0%A4%A')).toBe('%E0%A4%A')
  })
})
