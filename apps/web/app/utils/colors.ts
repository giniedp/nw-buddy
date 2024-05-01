import { crc32 as crc } from 'js-crc'

export function crc32(value: string) {
  return parseInt(crc(value.toLowerCase()), 16)
}

export function stringToColor(value: string) {
  return `#${crc32(value).toString(16).padStart(6, '0')}`.substring(0, 7)
}
