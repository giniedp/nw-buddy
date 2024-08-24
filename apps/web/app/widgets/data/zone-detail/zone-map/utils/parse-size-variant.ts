import tinycolor from 'tinycolor2'
import { ParsedLootTable } from './parse-loottable'

const SIZE_LABELS = {
  Huge: 'XL',
  Large: 'LG',
  Medium: 'MD',
  Small: 'SM',
  Tiny: 'XS',
  XSmall: 'XXS',
}
const SIZE_SCALE = {
  Huge: 1.5,
  Large: 1.25,
  Medium: 1,
  Small: 0.75,
  Tiny: 0.5,
  XSmall: 0.5,
}
const SIZE_ZINDEX = {
  Huge: 1,
  Large: 2,
  Medium: 3,
  Small: 4,
  Tiny: 5,
  XSmall: 6,
}
export function parseSizeVariant({ tokenized }: ParsedLootTable) {
  for (const size in SIZE_LABELS) {
    if (tokenized.includes(size)) {
      return {
        size,
        label: SIZE_LABELS[size],
        scale: SIZE_SCALE[size],
        zindex: SIZE_ZINDEX[size],
      }
    }
  }
  return null
}

export function getSizeColor(sizeType: string, color: string) {
  if (!color || !sizeType || !SIZE_SCALE[sizeType]) {
    return color
  }
  const min = SIZE_SCALE.Tiny
  const max = SIZE_SCALE.Huge
  const scale = SIZE_SCALE[sizeType] / (max - min)
  const hsl = tinycolor(color).toHsl()
  return tinycolor({
    ...hsl,
    l: lerp(0.8, 0.4, scale),
  }).toHexString()
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
