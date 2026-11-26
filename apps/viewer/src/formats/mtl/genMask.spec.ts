import { describe, expect, it } from 'vitest'
import { genMaskToString, isHexGenMask, parseShaderExt } from './genMask'

const EXT = `
// comment Property { Name = %IGNORED Mask = 0x1 }
Property
{
  Name = %NOISE
  Mask = 0x1
  Property    (Dust & Turbulence)
}
Property
{
  Name = %RECEIVE_SHADOWS
  Mask = 0x2
}
Property
{
  Name = %UV_VIGNETTING
  Mask = 0x4
}
Property
{
    Name = %VERTICAL_GRADIENT
    Mask = 0x20
}
Property
{
    Name = %APPLY_FOG_COLOR
    Mask = 0x100
}
`

describe('genMask', () => {
  it('parses the flag masks of a shader .ext', () => {
    expect(parseShaderExt(EXT)).toEqual([
      ['%NOISE', 0x1n],
      ['%RECEIVE_SHADOWS', 0x2n],
      ['%UV_VIGNETTING', 0x4n],
      ['%VERTICAL_GRADIENT', 0x20n],
      ['%APPLY_FOG_COLOR', 0x100n],
    ])
  })

  it('decodes a 32 bit GenMask as decimal', () => {
    expect(genMaskToString('39', parseShaderExt(EXT), false)).toBe(
      '%NOISE%RECEIVE_SHADOWS%UV_VIGNETTING%VERTICAL_GRADIENT',
    )
  })

  it('decodes a 64 bit GenMask as hex', () => {
    expect(genMaskToString('39', parseShaderExt(EXT), true)).toBe('%NOISE%VERTICAL_GRADIENT')
    expect(genMaskToString('100', parseShaderExt(EXT), true)).toBe('%APPLY_FOG_COLOR')
  })

  it('takes a hex GenMask by the MtlFlags bit 0x80000', () => {
    expect(isHexGenMask(524416)).toBe(true)
    expect(isHexGenMask(1)).toBe(false)
    expect(isHexGenMask(undefined)).toBe(false)
  })

  it('decodes nothing from an invalid mask', () => {
    expect(genMaskToString('x', parseShaderExt(EXT), false)).toBe('')
  })
})
