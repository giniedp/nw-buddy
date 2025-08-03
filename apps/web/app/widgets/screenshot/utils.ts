import { toBlob, toCanvas } from 'html-to-image'
import { createEl } from '~/utils'

export function getScreenshotOverlay(document: Document) {
  const id = 'nwb-screenshot-root'
  let root = document.querySelector<HTMLElement>(`#${id}`)
  if (!root) {
    root = createEl(
      document,
      'div',
      {
        attrs: {
          id: id,
          class: 'absolute inset-0 overflow-visible backdrop-blur-sm z-50 flex items-center justify-center',
        },
      },
      [
        createEl(document, 'span', {
          class:
            'btn loading loading-infinity absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50',
          text: 'Capture',
        }),
      ],
    )
    document.body.appendChild(root)
  }
  return root
}

export async function renderScreenshot({
  el,
  overlay,
  isDetached,
}: {
  el: HTMLElement
  overlay: HTMLElement
  isDetached: boolean
}) {
  const hasHeadElements = el.querySelectorAll('.screenshot-head').length > 0
  const hasBodyElements = el.querySelectorAll('.screenshot-body').length > 0
  if (isDetached && (hasHeadElements || hasBodyElements)) {
    // Workaround for firefox which cant handle large DOM trees
    const headerClone = cloneElement(el)
    headerClone.querySelectorAll('.screenshot-body').forEach((it) => it.remove())

    const bodyClone = cloneElement(el)
    bodyClone.querySelectorAll('.screenshot-head').forEach((it) => it.remove())
    //
    el.remove()

    el = document.createElement('div')

    if (hasHeadElements) {
      overlay.appendChild(headerClone)
      const c1 = await toCanvas(headerClone, {
        pixelRatio: 1,
      })
      headerClone.remove()
      el.appendChild(c1)
    }

    if (hasBodyElements) {
      overlay.appendChild(bodyClone)
      const c2 = await toCanvas(bodyClone, {
        pixelRatio: 1,
      })
      bodyClone.remove()
      el.appendChild(c2)
    }

    overlay.appendChild(el)
  }

  return toBlob(el, {
    pixelRatio: 1,
  })
}

export function cloneElement(original: HTMLElement) {
  const result = document.createElement('div')
  result.innerHTML = original.outerHTML
  return result
}
