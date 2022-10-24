import { DOCUMENT } from "@angular/common"
import { Inject, Injectable } from "@angular/core"
import { createElement, CreateElementOptions } from "~/utils"

@Injectable({ providedIn: 'root' })
export class DataTableutilsService {

  public constructor(
    @Inject(DOCUMENT)
    private document: Document
  ) {

  }

  public createIcon(cb: (el: HTMLPictureElement, img: HTMLImageElement) => void) {
    return this.createElement('picture', (el) => {
      const img = this.createElement('img', (img) => {
        img.onload
        img.classList.add('fade')
        img.onerror = () => {
          img.classList.remove('show')
          img.classList.add('error')
        }
        img.onload = () => {
          img.classList.add('show')
          img.classList.remove('error')
        }
      })
      el.append(img)
      cb(el, img)
    })
  }

  public createElement<T extends keyof HTMLElementTagNameMap>(
    tag: T | CreateElementOptions<T>,
    cb?: (el: HTMLElementTagNameMap[T]) => void
  ) {
    const document = this.document
    const el = typeof tag === 'string' ? document.createElement(tag) : createElement(document, tag)
    if (cb) {
      cb(el)
    }
    return el
  }
}

