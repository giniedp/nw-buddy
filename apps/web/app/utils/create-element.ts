
export interface CreateElementOptions<T extends keyof HTMLElementTagNameMap> {
  tag: T
  classList?: string[]
  html?: string
  text?: string
  events?: Partial<GlobalEventHandlers>
  tap?: (el: HTMLElementTagNameMap[T]) => void
  children?: Array<HTMLElement | CreateElementOptions<keyof HTMLElementTagNameMap>>
}

export function createElement<T extends keyof HTMLElementTagNameMap>(document: Document, input: CreateElementOptions<T>) {
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
