import {
  ColDef,
  ColGroupDef,
  ICellRendererFunc,
  ValueFormatterFunc,
  ValueFormatterParams,
  ValueGetterFunc,
  ValueGetterParams,
} from '@ag-grid-community/core'
import { DOCUMENT } from '@angular/common'
import { Injectable, NgZone, SecurityContext, Type, inject } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { ItemPreferencesService } from '~/preferences'
import { ElementChildren, ElementProps, TagName, createEl } from '~/utils'
import { AsyncCellRenderer, AsyncCellRendererParams } from '~/ui/data/ag-grid'
import { getIconFrameClass } from '../../item-frame'
import { colDefPrecision } from './utils'
import { Router } from '@angular/router'
import { twMerge } from 'tailwind-merge'

@Injectable({ providedIn: 'root' })
export class TableGridUtils<T = any> {
  public readonly db = inject(NwDbService)
  public readonly document: Document = inject(DOCUMENT)
  public readonly expr = inject(NwExpressionService)
  public readonly i18n = inject(TranslateService)
  public readonly itemPref = inject(ItemPreferencesService)
  public readonly nwLink = inject(NwLinkService)
  public readonly router = inject(Router)
  public readonly sanitizer = inject(DomSanitizer)
  public readonly zone = inject(NgZone)

  public readonly precision = {
    ...colDefPrecision,
  }

  public fieldName(k: keyof T) {
    return String(k)
  }

  public fieldGetter<K extends keyof T = keyof T>(
    k: K,
    transform: (it: T[K]) => any = (it) => it
  ): string | ValueGetterFunc {
    return this.valueGetter(({ data }) => transform(data[k]))
  }

  public valueGetter(fn: keyof T | ((params: ValueGetterParams<T>) => any)): string | ValueGetterFunc {
    return fn as any
  }

  public valueFormatter<V>(fn: keyof T | ((params: ValueFormatterParams<T, V>) => any)): string | ValueFormatterFunc {
    return fn as any
  }

  public colDef(data: ColDef & Required<Pick<ColDef, 'colId' | 'headerValueGetter'>>): ColDef {
    return data
  }

  public colGroupDef(data: ColDef & ColGroupDef & Required<Pick<ColGroupDef, 'children' | 'headerName'>>): ColDef {
    return data
  }

  public cellRenderer(fn: ICellRendererFunc<T>) {
    return fn
  }

  public cellRendererAsync(): Type<AsyncCellRenderer<T>> {
    return AsyncCellRenderer
  }

  public cellRendererAsyncParams<R>(params: AsyncCellRendererParams<T, R>) {
    return params
  }

  public trimNumberError(value: number) {
    if (typeof value === 'number') {
      return Number(value.toPrecision(7))
    }
    return value
  }

  public tl8(token: string | string[], locale?: string) {
    return this.i18n.get(token, locale)
  }

  public el<T extends keyof HTMLElementTagNameMap>(
    tagName: TagName<T>,
    attr: ElementProps<T>,
    children?: ElementChildren
  ) {
    return createEl(this.document, tagName, attr, children)
  }

  public elA(attrs: ElementProps<'a'>, children?: ElementChildren) {
    return this.el('a', attrs, children)
  }

  public elPicture(attrs: ElementProps<'picture'>, children?: ElementChildren) {
    return this.el('picture.w-12.h-12.nw-icon', attrs, children)
  }

  public elImg(attrs: ElementProps<'img'> & { src: string }) {
    const img = this.el('img', attrs)
    this.fadeImage(img)
    if (attrs.src) {
      img.setAttribute('src', attrs.src)
    }
    return img
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
    return img
  }

  public elItemIcon(
    props: ElementProps<'picture'> & {
      icon: string
      rarity?: number
      isNamed?: boolean
      isArtifact?: boolean
    }
  ) {
    return this.elPicture(
      {
        class: [
          ...getIconFrameClass({
            rarity: props.rarity,
            isNamed: props.isNamed,
            isArtifact: props.isArtifact,
            solid: true,
          }),
          ...(props.class || []),
        ],
      },
      [
        props.rarity ? this.el('span', { class: 'nw-item-icon-border' }) : null,
        this.elImg({
          src: props.icon,
        }),
      ]
    )
  }

  public tagsEl(tags: Array<ElementProps<'span'>>, attr: ElementProps = {}) {
    return this.el(
      'div.flex.flex-row.flex-wrap.gap-1.items-center',
      attr,
      tags?.map((attr) => {
        return this.el('span.badge.badge-sm.badge-secondary.bg-secondary.bg-opacity-50.px-1', attr)
      })
    )
  }

  public tagsRenderer = ({
    transform,
    getClass,
  }: {
    transform: (it: any) => string
    getClass?: (value: any) => string[]
  }): ICellRendererFunc<T> => {
    return ({ value }) => {
      if (value && !Array.isArray(value)) {
        value = [value]
      }
      return this.el(
        'div.flex.flex-row.flex-wrap.gap-1.items-center',
        {},
        value?.map((tag: string) => {
          return this.el('span.badge.badge-sm.badge-secondary.bg-secondary.bg-opacity-50.px-1', {
            text: transform(tag),
            class: getClass?.(tag),
          })
        })
      )
    }
  }

  public sanitizeHtml(value: string) {
    return this.sanitizer.sanitize(SecurityContext.HTML, value)
  }

  public lineBreaksToHtml(value: string) {
    return value?.replace(/\\n/gi, '<br>')
  }

  public lineBreaksRenderer = (): ICellRendererFunc<T> => {
    return ({ value }) => {
      return value?.replace(/\\n/gi, '<br>')
    }
  }
}
