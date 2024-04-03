import { sortBy } from 'lodash'
import { unparse } from 'papaparse'
import * as path from 'path'
import { glob, withProgressBar } from '../utils'
import { normalizeLocaleKey, readLocaleFile } from './locales'
import { AsciiTable3 } from 'ascii-table3'

export async function extractLocaleDiffs(inputDir: string) {
  const locales: Record<string, Record<string, string>> = {}
  const files = await glob(path.join(inputDir, '**/*.loc.json'))
  for await (let { lang, key, value } of readLocaleFile(files)) {
    key = normalizeLocaleKey(key)
    locales[lang] = locales[lang] || {}
    locales[lang][key] = value || ''
  }

  const result: Array<{ locale: string; rows: any[], csv: string, ascii: string }> = []
  const refLang = 'en-us'
  const refDict = locales[refLang] || {}
  const keys = Object.keys(refDict)
  const langs = Object.keys(locales)
  langs.splice(langs.indexOf(refLang), 1)
  langs.unshift(refLang)
  await withProgressBar({ barName: '  Diffs', tasks: langs }, async (lang, _, log) => {
    log(lang)
    if (lang === refLang) {
      return
    }
    const data = []

    for (const key of keys) {
      const ex1 = sortBy(scanForExpressions(refDict[key] || ''), (it) => it.toLowerCase().trim().replace(/\s+/g, ' '))
      const ex2 = sortBy(scanForExpressions(locales[lang][key] || ''), (it) =>
        it.toLowerCase().trim().replace(/\s+/g, ' '),
      )
      const v1 = ex1.join('').toLowerCase().replace(/\s+/g, ' ')
      const v2 = ex2.join('').toLowerCase().replace(/\s+/g, ' ')
      if (v1 === v2) {
        continue
      }
      const count = Math.max(ex1.length, ex2.length)
      for (let i = 0; i < count; i++) {
        const expr1 = ex1[i] || ''
        const expr2 = ex2[i] || ''
        if (i === 0) {
          data.push([key, expr1, expr2])
        } else {
          data.push(['', expr1, expr2])
        }
      }
    }

    if (!data.length) {
      return
    }
    data.unshift(['DICT KEY', refLang.toUpperCase(), lang.toUpperCase()])
    result.push({
      locale: lang,
      rows: data,
      csv: unparse(data, {
        delimiter: ';',
        header: true,
      }),
      ascii: new AsciiTable3().addRowMatrix(data).toString()
    })
  })

  return result
}

/**
 * Detects pairs of {[ and ]} in the text and returns the content between them.
 */
function scanForExpressions(text: string) {
  let outside = true
  const result: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (outside && exprBegin(text, i)) {
      i += 2
      start = i
      if (exprEnd(text, i)) {
        // rare case: {[{[ expression content ]}]}
        i += 2
        start = i
      }
      outside = !outside
    }
    if (!outside && exprEnd(text, i)) {
      result.push(text.substring(start, i))
      outside = !outside
    }
  }
  return result
}
function exprBegin(text: string, i: number) {
  return text[i] === '{' && text[i + 1] === '['
}
function exprEnd(text: string, i: number) {
  return text[i] === ']' && text[i + 1] === '}'
}
