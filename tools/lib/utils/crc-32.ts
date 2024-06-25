import { crc32 as crc } from 'js-crc'

export function crc32(value: string) {
  return parseInt(crc(value), 16)
}
