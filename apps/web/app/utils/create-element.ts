import { twMerge } from 'tailwind-merge'
export interface CreateElementOptions<T extends keyof HTMLElementTagNameMap> {
  tag: T
  classList?: string[]
  html?: string
  text?: string
  events?: Partial<GlobalEventHandlers>
  tap?: (el: HTMLElementTagNameMap[T]) => void
  children?: Array<HTMLElement | CreateElementOptions<keyof HTMLElementTagNameMap>>
}

export function createElement<T extends keyof HTMLElementTagNameMap>(
  document: Document,
  input: CreateElementOptions<T>,
) {
  const el = document.createElement(input.tag)
  if (input.classList) {
    el.classList.add(...input.classList)
  }
  if (input.html) {
    el.innerHTML = input.html
  }
  if (input.text) {
    el.textContent = input.text
  }
  if (input.events) {
    for (const key in input.events) {
      el[key] = input.events[key]
    }
  }
  if (input.tap) {
    input.tap(el)
  }
  if (input.children) {
    for (const child of input.children) {
      if (child instanceof HTMLElement) {
        el.append(child)
      } else if (child) {
        el.append(createElement(document, child))
      }
    }
  }
  return el
}

export type ElementTag = keyof HTMLElementTagNameMap
export type TagName<T extends ElementTag> = T | `${T}.${string}`
export interface ElementProps<T extends ElementTag = 'div'> {
  class?: string | string[]
  html?: string
  text?: string
  attrs?: Record<string, string>
  ev?: Partial<GlobalEventHandlers>
  tap?: (el: HTMLElementTagNameMap[T]) => void
}
export type ElementChildren = HTMLElement | Array<HTMLElement>

export function createEl<T extends ElementTag>(
  document: Document,
  tagName: TagName<T>,
  attr: ElementProps<T>,
  children?: ElementChildren,
) {
  const tokens = tagName.split('.')
  const tag = tokens.shift() as T
  const el = document.createElement(tag)
  if (attr.class) {
    el.setAttribute('class', twMerge(tokens, attr.class))
  } else {
    el.setAttribute('class', twMerge(tokens))
  }
  if (attr.html) {
    el.innerHTML = attr.html
  }
  if (attr.text) {
    el.textContent = attr.text
  }
  if (attr.ev) {
    for (const key in attr.ev) {
      el[key] = attr.ev[key]
    }
  }
  if (attr.attrs) {
    for (const key in attr.attrs) {
      el.setAttribute(key, attr.attrs[key])
    }
  }
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child) {
        el.append(child)
      }
    }
  } else if (children) {
    el.append(children)
  }
  if (attr.tap) {
    attr.tap(el)
  }
  return el
}
