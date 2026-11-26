import { describe, expect, it } from 'vitest'
import { sniff } from './files'

const bytes = (...values: number[]) => new Uint8Array(values)
const text = (value: string) => new TextEncoder().encode(value)

describe('sniff', () => {
  it('detects binary object streams by their header', () => {
    for (const version of [1, 2, 3]) {
      expect(sniff(bytes(0, 0, 0, 0, version, 0x12, 0x34))).toBe('objectstream')
    }
    expect(sniff(bytes(0, 0, 0, 0, 4))).toBe('binary')
  })

  it('detects xml object streams', () => {
    expect(sniff(text('<ObjectStream version="3">'))).toBe('objectstream-xml')
    expect(sniff(text('<Material Shader="Illum"/>'))).toBe('text')
  })

  it('tells text from binary', () => {
    expect(sniff(text('key = value\n'))).toBe('text')
    expect(sniff(text('Grüße'))).toBe('text')
    expect(sniff(new Uint8Array(0))).toBe('text')
    expect(sniff(bytes(0x44, 0x44, 0x53, 0x20, 0x7c, 0, 0, 0))).toBe('binary')
    expect(sniff(bytes(0xff, 0xfe, 0x41))).toBe('binary')
  })

  it('accepts text cut in the middle of a character, every time', () => {
    // "ü" is 0xc3 0xbc, the head ends after 0xc3
    const cut = text('Grü').subarray(0, 3)
    expect(sniff(cut)).toBe('text')
    // a fresh decoder per call: the cut byte must not leak into the next sniff
    expect(sniff(text('plain'))).toBe('text')
  })
})
