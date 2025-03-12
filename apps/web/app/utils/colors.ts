import { crc32 as crc } from 'js-crc'
import tc from 'tinycolor2'

export function crc32(value: string) {
  return parseInt(crc(value.toLowerCase()), 16)
}

export function stringToColor(value: string) {
  return `#${crc32(value).toString(16).padStart(6, '0')}`.substring(0, 7)
}

export function stringToHue(value: string) {
  return (crc32(value) / 0xffffffff) * 360
}

export function stringToHSL(value: string, s = 100, l = 50) {
  const hue = stringToHue(value)
  return tc({ h: hue, s, l })
}
