/**
 * Wwise short id of a name: 32 bit FNV-1 over the lower cased name.
 * Used for event, switch group, switch state, state and game parameter ids in the banks.
 */
export function wwiseShortId(name: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < name.length; i++) {
    let byte = name.charCodeAt(i) & 0xff
    if (byte >= 0x41 && byte <= 0x5a) {
      byte += 0x20
    }
    hash = Math.imul(hash, 0x01000193) ^ byte
  }
  return hash >>> 0
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

/**
 * `AZ::Crc32` of a lower cased name, as used by the trigger bank map (event names and bank names)
 */
export function azCrc32(name: string) {
  let crc = 0xffffffff
  for (let i = 0; i < name.length; i++) {
    let byte = name.charCodeAt(i) & 0xff
    if (byte >= 0x41 && byte <= 0x5a) {
      byte += 0x20
    }
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}
