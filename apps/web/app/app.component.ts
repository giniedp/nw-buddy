import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { DOCUMENT } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { map, of, Subject, switchMap, take, takeUntil } from 'rxjs'

import { TranslateService } from './i18n'

import { LANG_OPTIONS } from './app-menu'
import { AppPreferencesService } from './preferences'
import { svgMap } from './ui/icons/svg'
import { LayoutService } from './ui/layout'
import { mapProp } from './utils'
import { PlatformService } from './utils/platform.service'
import { VersionService } from './widgets/update-alert'

@Component({
  selector: 'nw-buddy-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('listAnimation', [
      transition('void => *', [
        query(':enter', [style({ opacity: 0 }), stagger(100, [animate('0.3s', style({ opacity: 1 }))])]),
      ]),
    ]),
    trigger('headerAnimation', [
      state('void', style({ opacity: 0 })),
      state('true', style({ opacity: 1 })),
      transition('void => *', [animate('0.3s')]),
    ]),
    trigger('enteranimation', [
      transition(':enter', [style({ opacity: 0 }), animate('1s 0.3s ease-out', style({ opacity: 1 }))]),
    ]),
  ],
  host: {
    '[class.is-embed]': 'isEmbed',
  },
})
export class AppComponent implements OnInit, OnDestroy {
  public get isElectron() {
    return this.platform.isElectron
  }

  public get isWeb() {
    return this.platform.env.environment === 'WEB' || this.platform.env.environment === 'DEV'
  }

  public get isPtr() {
    return this.platform.env.isPTR
  }

  public get isOverwolf() {
    return this.platform.isOverwolf
  }

  public get language() {
    return this.preferences.language.get()
  }
  public set language(value: string) {
    this.preferences.language.set(value)
  }
  public get lang() {
    return LANG_OPTIONS.find((it) => it.value === this.language)?.label
  }
  public get isEmbed() {
    return this.router.url.split('/').some((it) => it === 'embed')
  }

  protected langOptions = LANG_OPTIONS
  protected langLoaded = false

  protected unfoldMenuWhen$ = this.preferences.collapseMenuMode
    .observe()
    .pipe(map((it) => (it === 'always' ? false : '(min-width: 1200px)')))

  protected unfoldMenu$ = this.unfoldMenuWhen$.pipe(
    switchMap((query) => {
      if (typeof query === 'string') {
        return this.layout.breakpoint.observe(query).pipe(mapProp('matches'))
      }
      return of(false)
    })
  )

  protected mapIcon = svgMap
  protected mapActive = false
  protected mapCollapsed = false

  private destroy$ = new Subject<void>()
  protected versionChanged$ = this.version.versionChanged$

  constructor(
    private preferences: AppPreferencesService,
    private platform: PlatformService,
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT)
    private document: Document,
    private translate: TranslateService,
    private layout: LayoutService,
    private version: VersionService,
    private router: Router
  ) {
    //
  }

  public ngOnInit(): void {
    this.preferences.language.observe().subscribe((locale) => {
      this.translate.use(locale)
    })
    this.translate.locale.value$
      .pipe(take(1))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onLangLoaded()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private onLangLoaded() {
    // 1s delay 0.3s animation
    this.langLoaded = true
    this.cdRef.markForCheck()
    setTimeout(() => this.removeLoader(), 150)
  }

  private removeLoader() {
    const el = this.document.querySelector('[data-loader]')
    el.classList.add('opacity-0')
    setTimeout(() => el.remove(), 300)
  }
}
