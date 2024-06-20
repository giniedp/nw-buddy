export interface LocaleValueScanner {
  scan(value: string): void
}

export function scanLocaleDictionary(dict: Record<string, any>, scanners: LocaleValueScanner[]) {
  for (const key in dict) {
    for (const scanner of scanners) {
      scanner.scan(dict[key])
    }
  }
}

export function localeExpressionScanner() {
  const expressions = new Set<string>()
  const resources = new Set<string>()
  const constants = new Set<string>()
  return {
    scan: (value: string) => {
      for (const it of scanForExpressions(value)) {
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
    },
    get expressions() {
      return Array.from(expressions.values()).sort()
    },
    get resources() {
      return Array.from(expressions.values()).sort()
    },
    get constants() {
      return Array.from(expressions.values()).sort()
    },
  }
}

export function localeImageScanner() {
  const images = new Set<string>()
  return {
    scan: (value: string) => {
      for (const html of scanForHtml(value)) {
        if (html.startsWith('<img')) {
          const match = html.match(/src="([^"]+)"/)
          if (match) {
            images.add(match[1].toLowerCase())
          }
        }
      }
    },
    get images() {
      return Array.from(images.values()).sort()
    },
  }
}

export function localeVariableScanner() {
  const variables = new Set<string>()
  return {
    scan: (value: string) => {
      for (const it of scanForVariables(value)) {
        variables.add(it)
      }
    },
    get variables() {
      return Array.from(variables.values()).sort()
    },
  }
}

export function localeHtmlScanner() {
  const html = new Set<string>()
  return {
    scan: (value: string) => {
      for (const it of scanForHtml(value)) {
        html.add(it)
      }
    },
    get html() {
      return Array.from(html.values()).sort()
    },
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
