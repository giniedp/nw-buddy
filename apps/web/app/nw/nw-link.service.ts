import { DOCUMENT } from '@angular/common'
import { Inject, Injectable, OnDestroy } from '@angular/core'
import { environment } from 'apps/web/environments/environment'
import { Subject, takeUntil } from 'rxjs'
import { LocaleService } from '~/i18n'
import { AppPreferencesService } from '~/preferences/app-preferences.service'
import { nwdbLinkUrl, NwLinkResource, nwguideLinkUrl } from './nw-link'

@Injectable({ providedIn: 'root' })
export class NwLinkService implements OnDestroy {
  private destroy$ = new Subject<void>()
  private provider: 'nwguide' | 'nwdb'
  public constructor(
    private locale: LocaleService,
    private pref: AppPreferencesService,
    @Inject(DOCUMENT)
    private document: Document
  ) {
    this.pref.tooltipProvider
      .observe()
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.provider = value
        if (value === 'nwguide') {
          this.installNwguide()
        } else {
          this.installNwdb()
        }
      })
  }

  public link(type: NwLinkResource, id: string) {
    if (!id || !type) {
      return null
    }
    if (this.provider === 'nwguide') {
      return nwguideLinkUrl({
        id: id,
        type: type,
        lang: this.locale.value,
        ptr: environment.isPTR,
      })
    }
    return nwdbLinkUrl({
      id: id,
      type: type,
      lang: this.locale.value,
      ptr: environment.isPTR,
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private installNwdb() {
    const script = 'https://nwdb.info/embed.js'
    const found = this.document.head.querySelector(`script[src="${script}"]`)
    if (found) {
      return
    }
    const el = this.document.createElement('script')
    el.async = true
    el.src = script
    this.document.head.append(el)
  }

  private installNwguide() {
    const script = 'https://new-world.guide/static/scripts/tooltip.min.js'
    const found = this.document.head.querySelector(`script[src="${script}"]`)
    if (found) {
      return
    }
    const el = this.document.createElement('script')
    el.async = true
    el.src = script
    this.document.defaultView['nwGuideUrl'] = 'https://new-world.guide'
    this.document.head.append(el)
  }
}
