import { environment } from 'apps/web/environments'
import { addHook, sanitize } from 'isomorphic-dompurify'

addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IMG') {
    node.classList.add('inline')
    let src = node.getAttribute('src') || ''
    if (src.match(/lyshineui\/images/i)) {
      src = src.replace(/lyshineui\/images/i, environment.nwDataUrl)
      src = src.replace(/\.(png|jpg)$/i, '')
      src = src + '.webp'
      src = src.toLowerCase()
      node.classList.add('nw-icon')
      node.setAttribute('src', src)
    }
  }

  if (node.tagName === 'FONT') {
    const face = node.getAttribute('face') || ''
    node.removeAttribute('face')
    if (face.match(/caslonant/i)) {
      node.classList.add('font-caslon')
    }
    if (face.match(/nimbus_/i)) {
      node.classList.add('font-nimbus')
    }
    if (face.match(/pica_/i)) {
      // node.classList.add('')
    }
    if (face.match(/_regular/i)) {
      node.classList.add('font-normal')
    }
    if (face.match(/_medium/i)) {
      node.classList.add('font-medium')
    }
    if (face.match(/_semibold/i)) {
      node.classList.add('font-semibold')
    }
    if (face.match(/_bold/i)) {
      node.classList.add('font-bold')
    }
    if (face.match(/_italic/i)) {
      node.classList.add('italic')
    }
  }
})

export function sanitizeHtml(text: string) {
  return sanitize(text)
}
