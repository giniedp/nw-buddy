import { DOCUMENT } from '@angular/common'
import { Injectable, effect, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { env } from 'apps/web/environments/env'
import { environment } from 'apps/web/environments/environment'
import { LocaleService } from '~/i18n'
import { AppPreferencesService } from '~/preferences/app-preferences.service'
import { injectIsBrowser } from '~/utils/injection/platform'
import { NwLinkOptions, NwLinkResource, buddyLinkUrl, nwdbLinkUrl } from './nw-link'

export type NwLinkProvider = 'nwdb' | 'buddy'

@Injectable({ providedIn: 'root' })
export class NwLinkService {
  private locale = inject(LocaleService)
  private document = inject(DOCUMENT)
  private preferences = inject(AppPreferencesService)
  private tooltipProvider = toSignal<NwLinkProvider>(this.preferences.tooltipProvider.observe())
  private tooltipEnabled = !env.disableTooltips && injectIsBrowser()

  public constructor() {
    effect(() => {
      if (this.tooltipEnabled && this.tooltipProvider() === 'nwdb') {
        installNwdb(this.document)
      }
    })
  }

  public withLocale(uri: string, locale = this.locale.value()) {
    if (!uri || !uri.startsWith('/')) {
      return uri
    }
    if (locale && locale !== 'en-us') {
      uri = `/${locale}${uri}`
    }
    return uri
  }

  public resourceLink({ type, category, id }: { type: NwLinkResource, category?: string, id: string }) {
    return buddyLinkUrl({
      id: id,
      type: type,
      category: category,
      lang: this.locale.value(),
      ptr: environment.isPTR,
    })
  }

  public tooltipLink(type: NwLinkResource, id: string) {
    if (!id || !type) {
      return null
    }
    const options: NwLinkOptions = {
      id: id,
      type: type,
      lang: this.locale.value(),
      ptr: environment.isPTR,
    }
    if (this.tooltipProvider() === 'nwdb') {
      return nwdbLinkUrl(options)
    }
    if (this.tooltipProvider() === 'buddy') {
      return buddyLinkUrl(options)
    }
    return ''
  }
}

function installNwdb(document: Document) {
  const script = 'https://nwdb.info/embed.js'
  const found = document.head.querySelector(`script[src="${script}"]`)
  if (found) {
    return
  }
  const el = document.createElement('script')
  el.async = true
  el.src = script
  document.head.appendChild(el)
}
