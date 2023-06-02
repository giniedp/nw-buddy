import { DOCUMENT, ɵDomAdapter as DomAdapter, ɵgetDOM as getDOM } from '@angular/common'
import { Inject, Injectable, ɵɵinject } from '@angular/core'

export type LinkDefinition = {
  charset?: string
  crossorigin?: string
  disabled?: string
  href: string
  hreflang?: string
  media?: string
  methods?: string
  rel?: string
  rev?: string
  sizes?: string
  target?: string
  type?: string
}

export function createLink() {
  return new LinkTagService(ɵɵinject(DOCUMENT))
}

@Injectable({ providedIn: 'root', useFactory: createLink, deps: [] })
export class LinkTagService {
  private dom: DomAdapter
  constructor(@Inject(DOCUMENT) private doc: Document) {
    this.dom = getDOM()
  }

  public addLink(link: LinkDefinition, forceCreation: boolean = false): HTMLLinkElement | null {
    if (!link) {
      return null
    }
    return this.getOrCreateElement(link, forceCreation)
  }

  public addLinks(links: LinkDefinition[], forceCreation: boolean = false): HTMLLinkElement[] {
    if (!links) {
      return []
    }
    return links.reduce((result: HTMLLinkElement[], link: LinkDefinition) => {
      if (link) {
        result.push(this.getOrCreateElement(link, forceCreation))
      }
      return result
    }, [])
  }

  public getLink(attrSelector: string): HTMLLinkElement | null {
    if (!attrSelector) {
      return null
    }
    return this.doc.querySelector(`link[${attrSelector}]`) || null
  }

  public getLinks(attrSelector: string): HTMLLinkElement[] {
    if (!attrSelector) {
      return []
    }
    const list /*NodeList*/ = this.doc.querySelectorAll(`link[${attrSelector}]`)
    return list ? [].slice.call(list) : []
  }

  public updateLink(link: LinkDefinition, selector?: string): HTMLLinkElement | null {
    if (!link) {
      return null
    }
    selector = selector || this.parseSelector(link)
    const meta = this.getLink(selector)
    if (meta) {
      return this.setMetaElementAttributes(link, meta)
    }
    return this.getOrCreateElement(link, true)
  }

  public removeLink(attrSelector: string): void {
    const meta = this.getLink(attrSelector)
    if (meta) {
      this.removeLinkElement(meta)
    }
  }

  public removeLinkElement(meta: HTMLLinkElement): void {
    if (meta) {
      this.dom.remove(meta)
    }
  }

  private getOrCreateElement(meta: LinkDefinition, forceCreation: boolean = false): HTMLLinkElement {
    if (!forceCreation) {
      const selector: string = this.parseSelector(meta)
      const elem = this.getLink(selector)
      // It's allowed to have multiple elements with the same href so it's not enough to
      // just check that element with the same href already present on the page. We also need to
      // check if element has tag attributes
      if (elem && this.containsAttributes(meta, elem)) {
        return elem
      }
    }
    const element: HTMLLinkElement = this.dom.createElement('link') as HTMLLinkElement
    this.setMetaElementAttributes(meta, element)
    const head = this.doc.getElementsByTagName('head')[0]
    head.appendChild(element)
    return element
  }

  private setMetaElementAttributes(link: LinkDefinition, el: HTMLLinkElement): HTMLLinkElement {
    Object.keys(link).forEach((prop: string) => el.setAttribute(prop, link[prop]))
    return el
  }

  private parseSelector(link: LinkDefinition): string {
    return `href="${link.href}"`
  }

  private containsAttributes(link: LinkDefinition, elem: HTMLLinkElement): boolean {
    return Object.keys(link).every((key: string) => elem.getAttribute(key) === link[key])
  }
}
