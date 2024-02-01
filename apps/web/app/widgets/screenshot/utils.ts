import { toBlob, toCanvas } from "html-to-image"
import { createEl } from "~/utils"

export function getScreenshotOverlay(document: Document = window.document) {
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
          class: 'btn loading loading-infinity absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50',
          text: 'Capture',
        }),
      ]
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
  el: HTMLElement,
  overlay: HTMLElement,
  isDetached: boolean,
}) {
  const hasHeadElements = el.querySelectorAll('.screenshot-head').length > 0
  if (isDetached && hasHeadElements) {
    // Workaround for firefox which cant handle large DOM trees
    const el1 = cloneElement(el)
    el1.querySelectorAll('.screenshot-body').forEach((it) => it.remove())
    const el2 = cloneElement(el)
    el2.querySelectorAll('.screenshot-head').forEach((it) => it.remove())
    //
    el.remove()

    overlay.appendChild(el1)
    const c1 = await toCanvas(el1, {
      pixelRatio: 1,
    })
    el1.remove()

    overlay.appendChild(el2)
    const c2 = await toCanvas(el2, {
      pixelRatio: 1,
    })
    el2.remove()

    el = document.createElement('div')
    el.appendChild(c1)
    el.appendChild(c2)
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
