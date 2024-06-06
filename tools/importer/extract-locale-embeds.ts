import * as path from 'path'
import { glob, withProgressBar } from '../utils'
import { readLocaleFile } from './locales'

export async function extractLocaleEmbeds(inputDir: string) {
  const expressions = new Set<string>()
  const resources = new Set<string>()
  const constants = new Set<string>()
  const variables = new Set<string>()
  const html = new Set<string>()
  const images = new Set<string>()

  const files = await glob(path.join(inputDir, '**/*.json'))
  await withProgressBar({ barName: '  Inspect', tasks: files }, async (file, _, log) => {
    for await (let { value } of readLocaleFile(file)) {
      const text = value || ''
      if (typeof value === 'number') {
        return
      }
      for (const match of text.matchAll(/<img(\s+\w+="[^"]+")*\ssrc="([^"]+)"/g) || []) {
        images.add(match[2])
      }

      for (const it of scanForExpressions(text)) {
        expressions.add(it)
        for (const literal of scanForLookupKeys(it)) {
          const dotIndex = literal.indexOf('.')
          if (dotIndex > 0) {
            resources.add(literal.substring(0, dotIndex))
          } else {
            constants.add(literal)
          }
        }
      }
      for (const it of scanForVariables(text)) {
        variables.add(it)
      }
      for (const it of scanForHtml(text)) {
        html.add(it)
      }
    }
  })

  return {
    images: Array.from(images.values()).sort(),
    resources: Array.from(resources.values()).sort(),
    constants: Array.from(constants.values()).sort(),
    variables: Array.from(variables.values()).sort(),
    html: Array.from(html.values()).sort(),
    expressions: Array.from(expressions.values()).sort(),
  }
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

/**
 * Detects all words that start with a letter and contain only letters, numbers and dots.
 */
function scanForLookupKeys(exp: string) {
  const match = exp.match(/[a-zA-Z]\w+(\.\w+)*/gi)
  if (!match) {
    return []
  }
  return match.map((exp) => exp)
}

/**
 * Detects pairs of { and } in the text and returns the content between them.
 * Skips all pairs that contain a [ and ].
 */
function scanForVariables(text: string) {
  let outside = true
  const result: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (outside && varBegin(text, i)) {
      i += 1
      start = i
      if (varBegin(text, i)) {
        i += 1
        start = i
      }
      outside = !outside
    }
    if (!outside && text[i] === '}') {
      result.push(text.substring(start, i))
      outside = !outside
    }
  }
  return result
}
function varBegin(text: string, i: number) {
  return text[i] === '{' && !exprBegin(text, i)
}

/**
 * Detects pairs of < and > in the text and returns the content between them.
 */
function scanForHtml(text: string) {
  let outside = true
  const result: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (outside && text[i] === '<') {
      start = i
      outside = !outside
    }
    if (!outside && text[i] === '>') {
      result.push(text.substring(start, i + 1))
      outside = !outside
    }
  }
  return result
}
