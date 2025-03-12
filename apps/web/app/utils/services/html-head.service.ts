import { Injectable, inject } from '@angular/core'
import { Meta, MetaDefinition, Title } from '@angular/platform-browser'
import { LinkDefinition, LinkTagService } from './link-tag.service'
import { injectLocation } from '../injection/location'

export interface PageMetadata {
  title?: string
  metaTags?: MetaDefinition[]
  linkTags?: LinkDefinition[]
}

export interface CommonMetadata {
  title?: string
  description?: string
  type?: string
  url?: string
  image?: string
  noIndex?: boolean
  noFollow?: boolean
}

@Injectable({ providedIn: 'root' })
export class HtmlHeadService {
  private titleService = inject(Title)
  private metaService = inject(Meta)
  private linkService = inject(LinkTagService)
  private location = injectLocation()

  public metaName = 'New World Buddy'
  public metaType = 'website'
  public metaUrl = this.origin
  public metaDescription = 'A sidekick app for New World. Open source. Free to use. No Ads.'
  public metaImage = `${this.origin}/assets/nw-buddy.png`

  public get origin() {
    return this.location.origin
  }

  public get currentUrl() {
    return this.location.href
  }

  public updateMetadata(update: CommonMetadata) {
    const title = update.title || this.metaName
    const description = update.description || this.metaDescription
    const url = update.url || this.currentUrl
    const image = this.buildImageUrl(update.image || this.metaImage)
    this.setMetadata({
      title: [this.metaName, update.title].filter((it) => !!it).join(' - '),
      metaTags: [
        { name: 'description', content: description },
        { name: 'twitter:card', content: 'summary' },

        { property: 'og:site_name', content: this.metaName },
        { property: 'og:type', content: update.type || this.metaType },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:image', content: image },

        { property: 'twitter:domain', content: this.location.hostname },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
        { property: 'twitter:url', content: url },
        { property: 'twitter:image', content: image },
      ],
    })
  }
  public setMetadata(update: PageMetadata) {
    if (update.title) {
      this.titleService.setTitle(update.title)
    }
    this.setMeta(update.metaTags || [])
    this.setLinks(update.linkTags || [])
  }

  private setMeta(tags: MetaDefinition[]) {
    for (const meta of tags) {
      const selector = getMetaSelector(meta)
      this.metaService.removeTag(selector)
      this.metaService.addTag(meta)
    }
  }

  private setLinks(links: LinkDefinition[]) {
    for (const link of links) {
      const selector = getLinkSelector(link)
      this.linkService.removeLink(selector)
      this.linkService.addLink(link)
    }
  }

  private buildImageUrl(path: string) {
    if (!path) {
      return null
    }
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) {
      return path
    }
    if (path.startsWith('/')) {
      return `${this.origin}${path}`
    }
    return `${this.origin}/${path}`
  }
}

function getMetaSelector(tag: MetaDefinition): string {
  const attr: string = tag.name ? 'name' : 'property'
  return `${attr}="${tag[attr]}"`
}
function getLinkSelector(link: LinkDefinition): string {
  return `href="${link.href}"`
}
