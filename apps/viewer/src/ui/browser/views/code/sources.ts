import type { TextConversion } from '../../../../api/browse'
import { sheetToJson } from '../../../../formats/datasheet/analysis'
import type { ViewContext } from '../registry'
import type { TextSource } from './types'

/**
 * Text files as they are
 */
export const text: TextSource = {
  read: async (ctx) => decodeText(await ctx.app.files.contentBytes(ctx.path)),
  language: (ctx, text) => languageOf(ctx.path, text),
}

/**
 * An object stream as xml: an xml object stream as it is, a binary one converted by nwbt
 */
export const xml: TextSource = {
  read: async (ctx) => {
    if (ctx.kind === 'objectstream-xml') {
      return decodeText(await ctx.app.files.contentBytes(ctx.path))
    }
    return ctx.app.nwbt.convertedText(ctx.path, 'xml')
  },
  language: () => 'xml',
}

/**
 * An object stream or a music sheet as json, converted by nwbt
 */
export const json: TextSource = {
  read: converted('json'),
  language: () => 'json',
}

/**
 * A compiled lua script, decompiled by nwbt (unluac)
 */
export const lua: TextSource = {
  read: converted('lua'),
  language: () => 'lua',
}

/**
 * A datasheet as json, from the sheet parsed in the frontend
 */
export const sheetJson: TextSource = {
  read: async (ctx) => sheetToJson(ctx.sheet.sheet),
  language: () => 'json',
}

function converted(conversion: TextConversion) {
  return (ctx: ViewContext) => ctx.app.nwbt.convertedText(ctx.path, conversion)
}

function decodeText(bytes: Uint8Array) {
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Monaco language of a text file: by its extension, else xml if the text starts with a tag (many xml files
 * have their own extension: mtl, cdf, chrparams, ent, …)
 */
export function languageOf(path: string, text: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1)
  switch (ext) {
    case 'json':
      return 'json'
    case 'lua':
      return 'lua'
    case 'cfg':
    case 'ini':
      return 'ini'
    case 'xml':
      return 'xml'
  }
  return /^﻿?\s*</.test(text.slice(0, 256)) ? 'xml' : 'plaintext'
}
