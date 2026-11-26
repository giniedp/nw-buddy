import { describe, expect, it } from 'vitest'
import { ascii, hexLayout, isMarked, offsetDigits, parseOffset, scrollTopOf } from './HexView.store'

describe('hexLayout', () => {
  it('renders the rows in view, one more for a partly shown row', () => {
    const layout = hexLayout({ size: 16 * 100, rowPx: 10, viewPx: 50, scrollTop: 200 })
    expect(layout).toMatchObject({ rows: 100, spacerPx: 1000, scaled: false, firstRow: 20, windowTop: 200 })
    expect(layout.visible).toEqual([20, 21, 22, 23, 24, 25])
  })

  it('stops at the last row', () => {
    const layout = hexLayout({ size: 16 * 10 + 3, rowPx: 10, viewPx: 50, scrollTop: 80 })
    expect(layout.rows).toBe(11)
    expect(layout.visible).toEqual([8, 9, 10])
  })

  it('maps the scroll range onto the rows of a file too long for the page', () => {
    // 1M rows of 10px: 10M px, capped at 8M
    const size = 16 * 1_000_000
    const top = hexLayout({ size, rowPx: 10, viewPx: 100, scrollTop: 0 })
    expect(top.scaled).toBe(true)
    expect(top.spacerPx).toBe(8_000_000)
    expect(top.firstRow).toBe(0)
    const end = hexLayout({ size, rowPx: 10, viewPx: 100, scrollTop: 8_000_000 - 100 })
    // the last view shows the end of the file
    expect(end.firstRow).toBe(1_000_000 - 10)
    expect(end.windowTop).toBe(8_000_000 - 100)
  })
})

describe('scrollTopOf', () => {
  it('scrolls to the row of an offset with two rows above it', () => {
    const metrics = { size: 16 * 100, rowPx: 10, viewPx: 50 }
    const layout = hexLayout({ ...metrics, scrollTop: 0 })
    expect(scrollTopOf(layout, metrics, 16 * 30 + 5)).toBe(280)
    expect(scrollTopOf(layout, metrics, 0)).toBe(0)
  })

  it('scales the position of a long file', () => {
    const metrics = { size: 16 * 1_000_000, rowPx: 10, viewPx: 100 }
    const layout = hexLayout({ ...metrics, scrollTop: 0 })
    expect(scrollTopOf(layout, metrics, metrics.size - 1)).toBe(8_000_000 - 100)
  })
})

describe('labels', () => {
  it('pads offsets to at least 8 hex digits', () => {
    expect(offsetDigits(100)).toBe(8)
    expect(offsetDigits(0x1_0000_0001)).toBe(9)
  })

  it('marks the bytes of the range', () => {
    const range = { offset: 10, length: 4 }
    expect([9, 10, 13, 14].map((at) => isMarked(range, at))).toEqual([false, true, true, false])
    expect(isMarked(undefined, 10)).toBe(false)
  })

  it('shows printable ascii, dots for the rest', () => {
    expect(ascii(new TextEncoder().encode('Ab~'))).toBe('Ab~')
    expect(ascii(Uint8Array.of(0, 0x41, 0x7f, 0xff))).toBe('.A..')
  })

  it('parses offsets in hex and decimal', () => {
    expect(parseOffset('0x1F0')).toBe(0x1f0)
    expect(parseOffset(' 1f0h ')).toBe(0x1f0)
    expect(parseOffset('496')).toBe(496)
    expect(parseOffset('1f0')).toBeUndefined()
    expect(parseOffset('')).toBeUndefined()
  })
})
