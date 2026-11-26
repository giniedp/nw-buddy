import { DDS } from '@gglib/loaders'
import { describe, expect, it } from 'vitest'
import { assembleDds, DdsAssembleError, DdsAssembleErrorCode, ddsLevelSize, type DdsSplitPart } from './assemble'

const DDPF_FOURCC = 0x4
const DDSCAPS2_CUBEMAP = 0x200
const DDSCAPS2_VOLUME = 0x200000
const DXGI_BC7_UNORM = 98
const D3D10_RESOURCE_DIMENSION_TEXTURE2D = 3

interface HeaderOptions {
  width: number
  height: number
  mips: number
  fourcc?: string
  depth?: number
  caps2?: number
  dxgi?: number
}

/**
 * A DDS header (+ DX10 extension when `dxgi` is given)
 */
function header(o: HeaderOptions): Uint8Array {
  const dx10 = o.dxgi != null
  const bytes = new Uint8Array(128 + (dx10 ? 20 : 0))
  const view = new DataView(bytes.buffer)
  bytes.set([0x44, 0x44, 0x53, 0x20]) // "DDS "
  view.setUint32(4, 124, true)
  view.setUint32(12, o.height, true)
  view.setUint32(16, o.width, true)
  view.setUint32(24, o.depth ?? 0, true)
  view.setUint32(28, o.mips, true)
  view.setUint32(76, 32, true)
  view.setUint32(80, DDPF_FOURCC, true)
  const fourcc = dx10 ? 'DX10' : (o.fourcc ?? 'DXT1')
  for (let i = 0; i < 4; i++) {
    bytes[84 + i] = fourcc.charCodeAt(i)
  }
  view.setUint32(112, o.caps2 ?? 0, true)
  if (dx10) {
    view.setUint32(128, o.dxgi, true)
    view.setUint32(132, D3D10_RESOURCE_DIMENSION_TEXTURE2D, true)
    view.setUint32(140, 1, true)
  }
  return bytes
}

/**
 * Bytes of the given length, every byte the tag (to tell level and layer apart)
 */
function fill(length: number, tag: number) {
  return new Uint8Array(length).fill(tag)
}

function concat(...chunks: Uint8Array[]) {
  const result = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let at = 0
  for (const chunk of chunks) {
    result.set(chunk, at)
    at += chunk.length
  }
  return result
}

/**
 * The tag of a level and layer
 */
const tag = (level: number, layer = 0) => 0x10 * (layer + 1) + level

function expectError(fn: () => unknown, code: DdsAssembleErrorCode) {
  try {
    fn()
  } catch (e) {
    expect(e).toBeInstanceOf(DdsAssembleError)
    expect((e as DdsAssembleError).code).toBe(code)
    return
  }
  throw new Error(`expected ${code}`)
}

describe('assembleDds', () => {
  // BC1 16x16, 3 mips: 128, 32 and 8 bytes
  const head = header({ width: 16, height: 16, mips: 3 })
  const level = (l: number, layer = 0) => fill([128, 32, 8][l], tag(l, layer))
  // two parts: .dds.2 is mip 0, .dds.1 is mip 1; the base holds mip 2
  const parts: DdsSplitPart[] = [
    { number: 1, data: level(1) },
    { number: 2, data: level(0) },
  ]
  const base = concat(head, level(2))

  it('lays out the parts before the small mips of the base', () => {
    const result = assembleDds(base, parts)
    expect(result.parts).toBe(2)
    expect(result.dropped).toBe(0)
    expect(result.data).toEqual(concat(head, level(0), level(1), level(2)))

    const dds = DDS.parse(result.data.buffer as ArrayBuffer)
    expect(dds.residentMipLevel).toBe(0)
    expect(dds.images.map((it) => it.faces[0].data[0])).toEqual([tag(0), tag(1), tag(2)])
  })

  it('does not depend on the order of the parts', () => {
    expect(assembleDds(base, [...parts].reverse()).data).toEqual(assembleDds(base, parts).data)
  })

  it('returns a texture without parts as it is', () => {
    const whole = concat(head, level(0), level(1), level(2))
    expect(assembleDds(whole, []).data).toEqual(whole)
  })

  it('ignores trailing bytes after the chain', () => {
    const result = assembleDds(concat(base, fill(4, 0xee)), parts)
    expect(result.data).toEqual(concat(head, level(0), level(1), level(2)))
  })

  it('drops the small mips the base lacks, and lowers the mip count', () => {
    const result = assembleDds(head, parts)
    expect(result.dropped).toBe(1)
    expect(result.info.mipCount).toBe(2)
    const dds = DDS.parse(result.data.buffer as ArrayBuffer)
    expect(dds.header.MipMapCount).toBe(2)
    expect(dds.images.map((it) => it.faces[0].data[0])).toEqual([tag(0), tag(1)])
  })

  it('lays out a cubemap face after face', () => {
    const cube = header({ width: 16, height: 16, mips: 3, caps2: DDSCAPS2_CUBEMAP })
    const faces = [0, 1, 2, 3, 4, 5]
    // a part holds its level of every face, face after face
    const cubeParts: DdsSplitPart[] = [
      { number: 2, data: concat(...faces.map((f) => level(0, f))) },
      { number: 1, data: concat(...faces.map((f) => level(1, f))) },
    ]
    const cubeBase = concat(cube, ...faces.map((f) => level(2, f)))
    const result = assembleDds(cubeBase, cubeParts)
    expect(result.data).toEqual(concat(cube, ...faces.flatMap((f) => [level(0, f), level(1, f), level(2, f)])))

    const dds = DDS.parse(result.data.buffer as ArrayBuffer)
    expect(dds.isCubemap).toBe(true)
    for (const l of [0, 1, 2]) {
      expect(dds.images[l].faces.map((it) => it.data[0])).toEqual(faces.map((f) => tag(l, f)))
    }
  })

  it('sizes the levels of a volume by their depth', () => {
    // 8x8x4 BC1: mip 0 is 32 bytes x 4 slices, mip 1 8 x 2, mip 2 8 x 1
    const volume = header({ width: 8, height: 8, depth: 4, mips: 3, caps2: DDSCAPS2_VOLUME })
    const info = DDS.parseHeader(volume.slice().buffer)
    expect([0, 1, 2].map((l) => ddsLevelSize(info, l))).toEqual([128, 16, 8])
    const result = assembleDds(concat(volume, fill(8, tag(2))), [
      { number: 2, data: fill(128, tag(0)) },
      { number: 1, data: fill(16, tag(1)) },
    ])
    const dds = DDS.parse(result.data.buffer as ArrayBuffer)
    expect(dds.isVolume).toBe(true)
    expect(dds.images.map((it) => it.faces[0].data.length)).toEqual([128, 16, 8])
  })

  it('reads the DX10 header', () => {
    // BC7 8x8, 2 mips: 64 and 16 bytes
    const dx10 = header({ width: 8, height: 8, mips: 2, dxgi: DXGI_BC7_UNORM })
    const result = assembleDds(concat(dx10, fill(16, tag(1))), [{ number: 1, data: fill(64, tag(0)) }])
    expect(result.info.headerSize).toBe(148)
    expect(result.data).toEqual(concat(dx10, fill(64, tag(0)), fill(16, tag(1))))
  })

  it('rejects a repeated or out of range part', () => {
    expectError(
      () =>
        assembleDds(base, [
          { number: 2, data: level(0) },
          { number: 2, data: level(0) },
        ]),
      DdsAssembleErrorCode.BadPart,
    )
    expectError(
      () =>
        assembleDds(base, [
          { number: 0, data: level(0) },
          { number: 1, data: level(1) },
        ]),
      DdsAssembleErrorCode.BadPart,
    )
    const four = [1, 2, 3, 4].map((number) => ({ number, data: level(0) }))
    expectError(() => assembleDds(base, four), DdsAssembleErrorCode.BadPart)
  })

  it('rejects a part of the wrong size', () => {
    expectError(
      () =>
        assembleDds(base, [
          { number: 1, data: level(1) },
          { number: 2, data: level(1) },
        ]),
      DdsAssembleErrorCode.SizeMismatch,
    )
  })

  it('rejects a base without parts that lacks mips', () => {
    expectError(() => assembleDds(base, []), DdsAssembleErrorCode.Truncated)
  })
})
