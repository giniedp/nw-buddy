/**
 * Appearance rows (armor, weapon and accessory appearances) as material parameters: the blend mask colors of the
 * row replace the `Mask_*` public params of the model's materials.
 */

/**
 * Public params of an `.mtl` by name, as `formats/mtl` reads them: numbers, colors as `r,g,b`
 */
export type MaterialParams = Record<string, string | number>

/**
 * A material whose public params change after creation (Illum, HumanSkin, Hair: the materials with appearance
 * masks). Only for material instances of their own model, shared materials would change for every model.
 */
export interface ParamsMaterial {
  setParams(params: MaterialParams): void
}

export function isParamsMaterial(material: unknown): material is ParamsMaterial {
  return typeof (material as Partial<ParamsMaterial> | null)?.setParams === 'function'
}

/**
 * Reads a cell of the appearance row by column name: its text, '' when empty or missing
 */
export type RowText = (column: string) => string

/**
 * The columns an appearance row needs to be one
 */
export function isAppearanceRow(text: RowText) {
  return ['MaskRColor', 'MaskR', 'MaskGColor', 'MaskBColor'].some((column) => text(column) !== '')
}

/**
 * The material params of an appearance row. `dyed` takes the dye masks of the row (`Mask{R,G,B}Dye`, …) as the game
 * does for a dyed item, the colors stay the row's (no dye colors here).
 *
 * @returns the params, null when a color does not parse (the game rejects the row)
 */
export function appearanceParams(text: RowText, dyed = false): MaterialParams | null {
  const strength = (column: string) => {
    const value = Number(text(column))
    // the game's comparisons map NaN to zero
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
  }
  const colors = ['MaskRColor', 'MaskGColor', 'MaskBColor', 'MaskASpecColor'].map((column) =>
    appearanceLinear(text(column)),
  )
  if (colors.some((it) => it == null)) {
    return null
  }
  const [r, g, b, spec] = colors as number[][]
  const overrides = dyed
    ? [strength('MaskROverride'), strength('MaskGDyeOverride'), strength('MaskBDyeOverride')]
    : [strength('MaskROverride'), strength('MaskGOverride'), strength('MaskBOverride')]
  const masks = dyed
    ? [strength('MaskRDye'), strength('MaskGDye'), strength('MaskBDye')]
    : [strength('MaskR'), strength('MaskG'), strength('MaskB')]
  const specStrength = dyed ? strength('MaskASpecDye') : strength('MaskASpec')
  const glossShift = strength('MaskAGlossShift')

  const params: MaterialParams = {}
  ;[r, g, b].forEach((color, i) => {
    const channel = 'RGB'[i]
    params[`Mask_${channel}_Color`] = rgb(color)
    params[`Mask_${channel}_Override`] = overrides[i]
    params[`Mask_${channel}`] = masks[i]
  })
  params.Mask_A_Gloss = strength('MaskAGloss')
  params.Mask_A_GlossShift = glossShift
  params.Mask_A_SpecColor_Override = specStrength
  params.Mask_A_SpecColor = rgb(spec)

  // the emittance of the material (the mtl's Emittance, PerMaterial_EmissiveColor), not a public param of the
  // shader: CryEngine's material params emissive_color / emissive_intensity (MaterialHelpers.cpp). The game applies
  // cells with a value. Exported rows show empty
  // numbers as 0, so the intensity is passed above 0 only: a row with a color and 0 keeps the material's intensity.
  const emissiveColor = text('EmissiveColor')
  if (emissiveColor !== '') {
    const color = appearanceLinear(emissiveColor)
    if (!color) {
      return null
    }
    params.emissive_color = rgb(color)
    const intensity = Math.min(Number(text('EmissiveIntensity')) || 0, 200)
    if (intensity > 0) {
      params.emissive_intensity = intensity
    }
  }
  return params
}

/**
 * Dye colors (`DyeColorData` rows) by appearance channel: R, G and B take a dye's `Color`, A its `SpecColor`.
 * Channels without a dye keep the appearance's own values.
 */
export interface AppearanceDyes {
  r?: RowText | null
  g?: RowText | null
  b?: RowText | null
  a?: RowText | null
}

/**
 * The material params of a dyed item: the row's params (undyed), each dyed channel takes the dye's color, its
 * `ColorAmount` / `ColorOverride` (else the row's dye mask `Mask{R,G,B}Dye` and override), and the A channel the dye's
 * `SpecColor`, `SpecAmount` (else `MaskASpecDye`) and `MaskGlossShift`. Slots the row disables
 * (`{R,G,B,A}DyeSlotDisabled`) keep their values.
 *
 * @remarks
 * The dye colors are the hex values / 255 as the game reads them (`rgba_hex_padded`), without the 2.2 exponent the
 * row's colors get (`appearanceLinear`).
 *
 * @returns the params, null when a color of the row does not parse
 */
export function dyedAppearanceParams(text: RowText, dyes: AppearanceDyes): MaterialParams | null {
  const params = appearanceParams(text)
  if (!params) {
    return null
  }
  const dyedOverrides = ['MaskROverride', 'MaskGDyeOverride', 'MaskBDyeOverride']
  const dyedMasks = ['MaskRDye', 'MaskGDye', 'MaskBDye']
  const channels = [dyes.r, dyes.g, dyes.b]
  channels.forEach((dye, i) => {
    const channel = 'RGB'[i]
    if (!dye || text(`${channel}DyeSlotDisabled`) === '1') {
      return
    }
    params[`Mask_${channel}_Color`] = rgb(dyeColor(dye('Color')))
    params[`Mask_${channel}`] = dyeNumber(dye, 'ColorAmount') ?? rowStrength(text, dyedMasks[i])
    params[`Mask_${channel}_Override`] = dyeNumber(dye, 'ColorOverride') ?? rowStrength(text, dyedOverrides[i])
  })
  const spec = dyes.a
  if (spec && text('ADyeSlotDisabled') !== '1') {
    // an empty SpecColor is the dye's Color
    params.Mask_A_SpecColor = rgb(dyeColor(spec('SpecColor') || spec('Color')))
    params.Mask_A_SpecColor_Override = dyeNumber(spec, 'SpecAmount') ?? rowStrength(text, 'MaskASpecDye')
    const glossShift = dyeNumber(spec, 'MaskGlossShift')
    if (glossShift != null) {
      params.Mask_A_GlossShift = glossShift
    }
  }
  return params
}

/**
 * A number cell of a dye row, null when it is empty (the game tests the cell for a value)
 */
function dyeNumber(dye: RowText, column: string): number | null {
  const value = dye(column)
  if (value === '') {
    return null
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

/**
 * A mask strength of the appearance row, 0-1 (NaN reads as 0)
 */
function rowStrength(text: RowText, column: string): number {
  const value = Number(text(column))
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
}

/**
 * A dye color as the game reads it: hex `[#]rrggbb[aa]`, padded with `F` to eight digits, each channel / 255
 * (`rgba_hex_padded`). Text without hex digits is black.
 */
export function dyeColor(text: string): number[] {
  let hex = text.startsWith('#') ? text.slice(1) : text
  while (hex.length < 8) {
    hex += 'F'
  }
  const raw = unsignedPrefix(hex, 16) ?? 0
  return [(raw >>> 24) & 0xff, (raw >>> 16) & 0xff, (raw >>> 8) & 0xff, raw & 0xff].map((it) => it / 255)
}

function rgb(color: number[]) {
  return `${color[0]},${color[1]},${color[2]}`
}

/**
 * An appearance color as linear rgba: `#rrggbb[aa]` or decimal `r,g,b[,a]`, 0-255, sRGB converted with exponent 2.2
 * (alpha stays linear). Text shorter than 7 characters is white.
 *
 * @returns null when it has fewer than three components or a component without digits
 */
export function appearanceLinear(text: string): number[] | null {
  if (text.length < 7) {
    return [1, 1, 1, 1]
  }
  let components: string[]
  let radix: number
  if (text.includes('#')) {
    components = [text.slice(1, 3), text.slice(3, 5), text.slice(5, 7)]
    if (text.length > 7) {
      components.push(text.slice(7, 9))
    }
    radix = 16
  } else {
    components = text.split(',')
    if (components.at(-1) === '') {
      // split_terminator: a trailing separator adds no component
      components.pop()
    }
    radix = 10
  }
  if (components.length < 3) {
    return null
  }
  const channels = components.slice(0, 4).map((it) => unsignedPrefix(it, radix))
  if (channels.some((it) => it == null)) {
    return null
  }
  const [r, g, b, a] = channels.map((it) => it! / 255)
  return [r ** 2.2, g ** 2.2, b ** 2.2, a ?? 1]
}

/**
 * The leading digits of a number (C `strtoul` like: leading space, a sign, `0x` for hex), null without digits
 */
function unsignedPrefix(value: string, radix: number): number | null {
  let digits = value.replace(/^[ \t\r\n\v\f]+/, '')
  let negative = false
  if (digits.startsWith('-')) {
    negative = true
    digits = digits.slice(1)
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1)
  }
  if (radix === 16 && /^0x[0-9a-f]/i.test(digits)) {
    digits = digits.slice(2)
  }
  const match = (radix === 16 ? /^[0-9a-f]+/i : /^[0-9]+/).exec(digits)
  if (!match) {
    return null
  }
  const raw = Math.min(parseInt(match[0], radix), 0xffffffff)
  // a negated unsigned wraps
  return negative ? (0x100000000 - raw) % 0x100000000 : raw
}
