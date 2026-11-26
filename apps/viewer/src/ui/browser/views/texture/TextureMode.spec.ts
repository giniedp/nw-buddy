import { DDS } from '@gglib/loaders'
import { describe as group, expect, it } from 'vitest'
import { describe, describeDds, isNormalMap, layerCount, mipSizeLabel } from './TextureMode.store'
import type { DdsTexture, TextureFacts } from './types'

function texture(info: Partial<DDS.DdsInfo>, color: { parts?: number; dropped?: number } = {}, alpha = false) {
  const assembled = (it: Partial<DDS.DdsInfo>) => ({
    data: new Uint8Array(0),
    info: {
      format: DDS.DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM,
      width: 256,
      height: 128,
      depth: 1,
      mipCount: 9,
      isCubemap: false,
      isVolume: false,
      ...it,
    } as DDS.DdsInfo,
    parts: color.parts ?? 0,
    dropped: color.dropped ?? 0,
  })
  return { color: assembled(info), alpha: alpha ? assembled({}) : null } satisfies DdsTexture
}

const facts = (it: Partial<TextureFacts>): TextureFacts => ({
  formatName: 'BC1_UNORM',
  width: 256,
  height: 128,
  mips: 9,
  depth: 1,
  cubemap: false,
  volume: false,
  linear: false,
  parts: 0,
  dropped: 0,
  alpha: false,
  normalMap: false,
  ...it,
})

group('describeDds', () => {
  it('reads the header of the assembled file', () => {
    const result = describeDds(texture({}, { parts: 3, dropped: 2 }, true), 'objects/x_diff.dds')
    expect(result).toEqual(facts({ parts: 3, dropped: 2, alpha: true }))
  })

  it('treats sRGB, float and BC6H formats as linear', () => {
    const linear = (format: number) => describeDds(texture({ format }), 'x.dds').linear
    expect(linear(DDS.DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM_SRGB)).toBe(true)
    expect(linear(DDS.DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_FLOAT)).toBe(true)
    expect(linear(DDS.DXGI_FORMAT.DXGI_FORMAT_BC6H_UF16)).toBe(true)
    expect(linear(DDS.DXGI_FORMAT.DXGI_FORMAT_BC7_UNORM)).toBe(false)
  })

  it('reports a two channel normal map by name and format', () => {
    const bc5 = DDS.DXGI_FORMAT.DXGI_FORMAT_BC5_UNORM
    expect(describeDds(texture({ format: bc5 }), 'x_ddna.dds').normalMap).toBe(true)
    expect(describeDds(texture({ format: bc5 }), 'x_diff.dds').normalMap).toBe(false)
    expect(describeDds(texture({}), 'x_ddn.dds').normalMap).toBe(false)
  })

  it('has one slice unless the texture is a volume', () => {
    expect(describeDds(texture({ depth: 4 }), 'x.dds').depth).toBe(1)
    expect(describeDds(texture({ depth: 4, isVolume: true }), 'x.dds').depth).toBe(4)
  })
})

group('layerCount', () => {
  it('scrubs the faces of a cubemap only face by face', () => {
    const cube = facts({ cubemap: true })
    expect(layerCount(cube, 'faces')).toBe(6)
    expect(layerCount(cube, 'sphere')).toBe(1)
    expect(layerCount(cube, 'cube')).toBe(1)
  })

  it('scrubs the slices of a volume', () => {
    expect(layerCount(facts({ volume: true, depth: 8 }), 'sphere')).toBe(8)
    expect(layerCount(facts({}), 'sphere')).toBe(1)
  })
})

group('labels', () => {
  it('tells normal maps by name', () => {
    expect(isNormalMap('a/b_ddn.dds')).toBe(true)
    expect(isNormalMap('a/b_DDNA.dds')).toBe(true)
    expect(isNormalMap('a/b_ddna.dds.a')).toBe(false)
    expect(isNormalMap('a/b_diff.dds')).toBe(false)
  })

  it('sizes a mip, at least one texel', () => {
    expect(mipSizeLabel(facts({}), 0)).toBe('256×128')
    expect(mipSizeLabel(facts({}), 2)).toBe('64×32')
    expect(mipSizeLabel(facts({}), 8)).toBe('1×1')
  })

  it('lists the facts in one line', () => {
    expect(describe(facts({}))).toBe('BC1_UNORM · 256×128 · 9 mips')
    expect(describe(facts({ cubemap: true, parts: 2, alpha: true, normalMap: true, dropped: 1 }))).toBe(
      'BC1_UNORM · 256×128 · 9 mips · cubemap · 2 split mips · alpha from .dds.a · normal map, z reconstructed · 1 small mips missing',
    )
    expect(describe(facts({ volume: true, depth: 4 }))).toBe('BC1_UNORM · 256×128 · 9 mips · 4 slices')
  })
})
