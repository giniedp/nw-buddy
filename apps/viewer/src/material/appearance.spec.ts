import { describe, expect, it } from 'vitest'
import { appearanceLinear, appearanceParams, dyeColor, dyedAppearanceParams, isAppearanceRow } from './appearance'

describe('appearanceLinear', () => {
  it('reads hex with exponent 2.2, alpha linear', () => {
    const [r, g, b, a] = appearanceLinear('#ff8000')!
    expect(r).toBeCloseTo(1)
    expect(g).toBeCloseTo((128 / 255) ** 2.2)
    expect(b).toBe(0)
    expect(a).toBe(1)
    expect(appearanceLinear('#ff800080')![3]).toBeCloseTo(128 / 255)
  })

  it('reads decimal components', () => {
    const [r, g, b] = appearanceLinear('255,128,0')!
    expect(r).toBeCloseTo(1)
    expect(g).toBeCloseTo((128 / 255) ** 2.2)
    expect(b).toBe(0)
  })

  it('is white below 7 characters', () => {
    expect(appearanceLinear('')).toEqual([1, 1, 1, 1])
    expect(appearanceLinear('#fff')).toEqual([1, 1, 1, 1])
  })

  it('rejects fewer than three components or no digits', () => {
    expect(appearanceLinear('255,128')).toBeNull()
    expect(appearanceLinear('#zz0000')).toBeNull()
  })
})

describe('appearanceParams', () => {
  const row: Record<string, string> = {
    MaskRColor: '#e30440',
    MaskGColor: '#b8b8b8',
    MaskBColor: '#b8b8b8',
    MaskASpecColor: '#ffffff',
    MaskR: '1',
    MaskROverride: '0.05',
    MaskRDye: '0.5',
    MaskGDyeOverride: '2',
    MaskASpec: '-1',
  }
  const text = (column: string) => row[column] ?? ''

  it('maps the row to the Mask_* public params', () => {
    const params = appearanceParams(text)!
    expect(params.Mask_R).toBe(1)
    expect(params.Mask_R_Override).toBe(0.05)
    expect(params.Mask_R_Color).toBe(`${(227 / 255) ** 2.2},${(4 / 255) ** 2.2},${(64 / 255) ** 2.2}`)
    // clamped to 0..1
    expect(params.Mask_A_SpecColor_Override).toBe(0)
    // an empty gloss shift is 0 (strength of an empty cell)
    expect(params.Mask_A_GlossShift).toBe(0)
    expect(isAppearanceRow(text)).toBe(true)
  })

  it('takes the dye masks when dyed, the red override stays', () => {
    const params = appearanceParams(text, true)!
    expect(params.Mask_R).toBe(0.5)
    expect(params.Mask_R_Override).toBe(0.05)
    expect(params.Mask_G_Override).toBe(1)
  })
})

describe('appearanceParams emissive', () => {
  const base: Record<string, string> = {
    MaskRColor: '#ffffff',
    MaskGColor: '#ffffff',
    MaskBColor: '#ffffff',
    MaskASpecColor: '#ffffff',
  }
  const textOf = (row: Record<string, string>) => (column: string) => row[column] ?? ''

  it('passes the emittance color (linear) and intensity (clamped to 200) of rows with a color', () => {
    const params = appearanceParams(textOf({ ...base, EmissiveColor: '#00aaff', EmissiveIntensity: '250' }))!
    expect(params.emissive_color).toBe(`0,${(0xaa / 255) ** 2.2},1`)
    expect(params.emissive_intensity).toBe(200)
  })

  it('keeps the material emittance without a color, and its intensity at 0', () => {
    const without = appearanceParams(textOf({ ...base, EmissiveIntensity: '0' }))!
    expect('emissive_color' in without).toBe(false)
    expect('emissive_intensity' in without).toBe(false)
    const zero = appearanceParams(textOf({ ...base, EmissiveColor: '#00aaff', EmissiveIntensity: '0' }))!
    expect('emissive_color' in zero).toBe(true)
    expect('emissive_intensity' in zero).toBe(false)
  })
})

describe('dyedAppearanceParams', () => {
  const row: Record<string, string> = {
    MaskRColor: '#e30440',
    MaskGColor: '#b8b8b8',
    MaskBColor: '#b8b8b8',
    MaskASpecColor: '#ffffff',
    MaskR: '1',
    MaskROverride: '0.05',
    MaskRDye: '0.5',
    MaskG: '1',
    MaskGDye: '0.25',
    MaskGDyeOverride: '0.75',
    MaskASpecDye: '0.4',
    BDyeSlotDisabled: '1',
  }
  const text = (column: string) => row[column] ?? ''
  const dye = (cells: Record<string, string>) => (column: string) => cells[column] ?? ''

  it('reads dye colors as hex / 255, padded with F', () => {
    expect(dyeColor('#336699')).toEqual([0x33 / 255, 0x66 / 255, 0x99 / 255, 1])
    expect(dyeColor('80402010')).toEqual([0x80 / 255, 0x40 / 255, 0x20 / 255, 0x10 / 255])
    expect(dyeColor('')).toEqual([1, 1, 1, 1])
    expect(dyeColor('#zz')).toEqual([0, 0, 0, 0])
  })

  it('takes the dye color and amounts, else the row dye masks', () => {
    const params = dyedAppearanceParams(text, {
      r: dye({ Color: '#336699', ColorAmount: '0.8', ColorOverride: '0.3' }),
      g: dye({ Color: '#000000' }),
    })!
    expect(params.Mask_R_Color).toBe(`${0x33 / 255},${0x66 / 255},${0x99 / 255}`)
    expect(params.Mask_R).toBe(0.8)
    expect(params.Mask_R_Override).toBe(0.3)
    // no amounts on the dye: the row's dye mask and override
    expect(params.Mask_G_Color).toBe('0,0,0')
    expect(params.Mask_G).toBe(0.25)
    expect(params.Mask_G_Override).toBe(0.75)
  })

  it('keeps undyed and disabled channels as the row has them', () => {
    const params = dyedAppearanceParams(text, { b: dye({ Color: '#ff0000' }) })!
    const undyed = appearanceParams(text)!
    expect(params).toEqual(undyed)
  })

  it('dyes the spec channel with SpecColor, SpecAmount and MaskGlossShift', () => {
    const params = dyedAppearanceParams(text, {
      a: dye({ Color: '#102030', SpecAmount: '0.9', MaskGlossShift: '0.2' }),
    })!
    // an empty SpecColor is the Color
    expect(params.Mask_A_SpecColor).toBe(`${0x10 / 255},${0x20 / 255},${0x30 / 255}`)
    expect(params.Mask_A_SpecColor_Override).toBe(0.9)
    expect(params.Mask_A_GlossShift).toBe(0.2)
    const withoutAmount = dyedAppearanceParams(text, { a: dye({ Color: '#102030' }) })!
    expect(withoutAmount.Mask_A_SpecColor_Override).toBe(0.4)
    expect(withoutAmount.Mask_A_GlossShift).toBe(0)
  })
})
