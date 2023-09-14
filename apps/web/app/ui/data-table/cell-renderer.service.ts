import { DOCUMENT } from '@angular/common'
import { Inject, Injectable } from '@angular/core'
import { ICellRendererFunc } from '@ag-grid-community/core'
import { assetUrl, createEl, CreateElAttrs, TagName } from '~/utils'

@Injectable({ providedIn: 'root' })
export class CellRendererService {
  public constructor(
    @Inject(DOCUMENT)
    private document: Document
  ) {}

  public element<T extends keyof HTMLElementTagNameMap>(
    tagName: TagName<T>,
    attr: CreateElAttrs<T>,
    children?: Array<HTMLElement>
  ) {
    return createEl(this.document, tagName, attr, children)
  }

  public link(attrs: CreateElAttrs<'a'>['attrs'], children?: Array<HTMLElement>) {
    return this.element('a', { attrs: attrs }, children)
  }
  public icon(attrs: CreateElAttrs<'picture'> & { rarity?: number; src: string }) {
    const result = this.element('picture.w-12.h-12.nw-icon', attrs, [
      this.element('img', {
        tap: (img) => {
          this.fadeImage(img)
          img.src = assetUrl(attrs.src)
        },
      }),
    ])
    if (attrs.rarity != null) {
      result.classList.add(`bg-rarity-${attrs.rarity}`)
    }
    return result
  }

  public fadeImage(img: HTMLImageElement) {
    img.loading = 'lazy'
    img.classList.add('fade')
    img.addEventListener('error', () => {
      img.classList.remove('show')
      img.classList.add('error')
    })
    img.addEventListener('load', () => {
      img.classList.add('show')
      img.classList.remove('error')
    })
  }

  public tagList(tags: string[]) {
    return this.element(
      'div.flex.flex-row.flex-wrap.gap-1.items-center',
      {},
      tags?.map((it: string) => {
        return this.element('span.badge.badge-sm.badge-secondary.bg-secondary.bg-opacity-50.px-1', {
          text: it,
        })
      })
    )
  }

  public tagListRenderer = (transform: (it: any) => string): ICellRendererFunc => {
    return ({ value }) => {
      return this.tagList(value?.map(transform))
    }
  }

  public lineBreaksRenderer = (): ICellRendererFunc => {
    return ({ value }) => {
      return value?.replace(/\\n/gi, '<br>')
    }
  }
}
