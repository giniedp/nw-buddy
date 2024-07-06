import { DOCUMENT } from '@angular/common'
import { DestroyRef, Inject, Injectable } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { env } from 'apps/web/environments/env'
import { environment } from 'apps/web/environments/environment'
import { LocaleService } from '~/i18n'
import { AppPreferencesService } from '~/preferences/app-preferences.service'
import { injectIsBrowser } from '~/utils/injection/platform'
import { NwLinkOptions, NwLinkResource, buddyLinkUrl, nwdbLinkUrl } from './nw-link'

export type NwLinkProvider = 'nwdb' | 'buddy'

@Injectable({ providedIn: 'root' })
export class NwLinkService {
  private provider: NwLinkProvider = 'buddy'
  private isEnaled = !env.disableTooltips && injectIsBrowser()

  public constructor(
    private locale: LocaleService,
    private pref: AppPreferencesService,
    private dRef: DestroyRef,
    @Inject(DOCUMENT)
    private document: Document,
  ) {
    this.watchSetting()
  }

  public link(type: NwLinkResource, id: string) {
    if (!id || !type) {
      return null
    }
    const options: NwLinkOptions = {
      id: id,
      type: type,
      lang: this.locale.value,
      ptr: environment.isPTR,
    }
    if (this.provider === 'nwdb') {
      return nwdbLinkUrl(options)
    }
    if (this.provider === 'buddy') {
      return buddyLinkUrl(options)
    }
    return ''
  }

  private watchSetting() {
    if (!this.isEnaled) {
      return
    }
    this.pref.tooltipProvider
      .observe()
      .pipe(takeUntilDestroyed(this.dRef))
      .subscribe((value) => {
        // nwgide has been temporarily removed
        // may be enabled when they update their site
        this.provider = this.isEnaled ? 'nwdb' : 'buddy'
        if (this.provider === 'nwdb') {
          installNwdb(this.document)
        }
      })
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
  document.head.append(el)
}
