/**
 * The markup of localized texts (LyShine rich text): `<font color face>`, `<b>`, `<i>`, `<img src>` icons and a
 * literal `\n` for line breaks. Speech and link tags (`<g>`, `<a>`, `<volume>`, …) keep only their text. Counted over
 * all en-us loc files on 2026-11-14: font 10,695, g 8,472, img 1,466, a 320, i 148, b 64.
 *
 * The text is parsed by the browser but never inserted as html: the result is built from new elements with
 * whitelisted styles, so the game data can not inject anything.
 */
import type { NwbtClient } from '../../api/browse'

/**
 * Pixels of the icon thumbnails, they show at the text height
 */
const ICON_SIZE = 32

function parse(text: string): Node {
  const doc = new DOMParser().parseFromString(`<body>${text.replace(/\\n/g, '\n')}</body>`, 'text/html')
  return doc.body
}

/**
 * The text without markup, line breaks as spaces (for grid cells and titles)
 */
export function locPlain(text: string): string {
  if (!text.includes('<') && !text.includes('\\n')) {
    return text
  }
  return (parse(text).textContent ?? '').replace(/\s*\n\s*/g, ' ')
}

/**
 * The text as formatted elements: colors, bold and italic, icons, line breaks (the container uses `white-space:
 * pre-line`)
 */
export function locElement(nwbt: NwbtClient, text: string): HTMLElement {
  const root = document.createElement('span')
  root.className = 'nw-loc'
  appendChildren(nwbt, root, parse(text))
  return root
}

function appendChildren(nwbt: NwbtClient, target: HTMLElement, source: Node) {
  for (const node of source.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      target.append(node.textContent ?? '')
    } else if (node instanceof Element) {
      const element = convert(nwbt, node)
      appendChildren(nwbt, element ?? target, node)
      if (element && element !== target) {
        target.append(element)
      }
    }
  }
}

/**
 * The element for a tag of the markup, null to keep only its children
 */
function convert(nwbt: NwbtClient, node: Element): HTMLElement | null {
  switch (node.tagName.toLowerCase()) {
    case 'font': {
      const span = document.createElement('span')
      const color = node.getAttribute('color') ?? ''
      if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) {
        span.style.color = color
      }
      // the font file names its style: Nimbus_SemiBold, Nimbus_Bold_Italic, Pica_Regular, …
      const face = (node.getAttribute('face') ?? '').toLowerCase()
      if (face.includes('bold')) {
        span.style.fontWeight = face.includes('semibold') ? '600' : '700'
      } else if (face.includes('medium')) {
        span.style.fontWeight = '500'
      }
      if (face.includes('italic')) {
        span.style.fontStyle = 'italic'
      }
      return span
    }
    case 'b':
      return document.createElement('b')
    case 'i':
      return document.createElement('i')
    case 'img': {
      const src = node.getAttribute('src') ?? ''
      if (!src) {
        return null
      }
      const img = document.createElement('img')
      img.className = 'nw-loc-icon'
      img.alt = ''
      // the paths have no extension, nwbt resolves the image
      img.src = nwbt.thumbnailUrl(`${src}.dds`, ICON_SIZE)
      return img
    }
    default:
      return null
  }
}
