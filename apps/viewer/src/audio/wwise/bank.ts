import { WwiseReader } from './reader'

/**
 * Raw HIRC entry: object type, id and the byte range of its body (after the id)
 */
export interface WwiseHircEntry {
  type: number
  id: number
  offset: number
  size: number
}

/**
 * Media embedded in a bank (`DIDX` index into the `DATA` section)
 */
export interface WwiseMediaEntry {
  id: number
  offset: number
  size: number
}

/**
 * A parsed `.bnk` sound bank. Only the section layout is decoded here, HIRC bodies are parsed on demand by {@link parseHircObject}.
 */
export interface WwiseBank {
  /**
   * `BKHD.dwBankGeneratorVersion`, New World ships 150
   */
  version: number
  /**
   * `BKHD.dwSoundBankID`, the short id of the bank name
   */
  id: number
  /**
   * `BKHD.dwLanguageID`, the short id of the language name: `SFX` for banks without voice, else the language folder
   * of the bank (e.g. `English(US)`), see `wwiseShortId` (hash.ts)
   */
  languageId: number
  /**
   * The bank bytes
   */
  bytes: Uint8Array
  /**
   * Embedded media by media id, offsets are absolute within {@link bytes}
   */
  media: Map<number, WwiseMediaEntry>
  /**
   * HIRC objects in bank order
   */
  hirc: WwiseHircEntry[]
}

export function parseWwiseBank(data: ArrayBufferLike | Uint8Array): WwiseBank {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const reader = new WwiseReader(bytes)
  const bank: WwiseBank = {
    version: 0,
    id: 0,
    languageId: 0,
    bytes,
    media: new Map(),
    hirc: [],
  }
  const didx: WwiseMediaEntry[] = []
  let dataOffset = -1

  while (reader.remaining >= 8) {
    const tag = reader.tag()
    const size = reader.u32()
    const start = reader.offset
    const section = new WwiseReader(bytes, start, Math.min(size, reader.remaining))
    switch (tag) {
      case 'BKHD': {
        bank.version = section.u32()
        bank.id = section.u32()
        if (section.remaining >= 4) {
          bank.languageId = section.u32()
        }
        break
      }
      case 'DIDX': {
        while (section.remaining >= 12) {
          didx.push({ id: section.u32(), offset: section.u32(), size: section.u32() })
        }
        break
      }
      case 'DATA': {
        dataOffset = start
        break
      }
      case 'HIRC': {
        const count = section.u32()
        for (let i = 0; i < count; i++) {
          const type = section.u8()
          const length = section.u32()
          const id = section.u32()
          bank.hirc.push({ type, id, offset: section.offset, size: length - 4 })
          section.skip(length - 4)
        }
        break
      }
    }
    reader.offset = start
    reader.skip(Math.min(size, reader.remaining))
  }

  if (dataOffset >= 0) {
    for (const entry of didx) {
      bank.media.set(entry.id, { id: entry.id, offset: dataOffset + entry.offset, size: entry.size })
    }
  }
  return bank
}

/**
 * The bytes of an embedded media file (a RIFF `.wem`), without copying
 */
export function getWwiseBankMedia(bank: WwiseBank, mediaId: number): Uint8Array | null {
  const entry = bank.media.get(mediaId)
  if (!entry) {
    return null
  }
  return bank.bytes.subarray(entry.offset, entry.offset + entry.size)
}
