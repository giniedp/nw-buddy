import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule, DOCUMENT } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { Subject, map, of, switchMap, takeUntil } from 'rxjs'

import { TranslateService } from './i18n'

import { LANG_OPTIONS } from './app-menu'
import { AppMenuComponent } from './app-menu.component'
import { NwModule } from './nw'
import { AppPreferencesService } from './preferences'
import { IconsModule } from './ui/icons'
import { svgMap } from './ui/icons/svg'
import { LayoutModule, LayoutService } from './ui/layout'
import { TooltipModule } from './ui/tooltip'
import { mapProp } from './utils'
import { PlatformService } from './utils/services/platform.service'
import { AeternumMapModule } from './widgets/aeternum-map'
import { GlobalSearchInputComponent } from './widgets/search'
import { UpdateAlertModule, VersionService } from './widgets/update-alert'
import { TitleBarComponent } from './title-bar.component'
import { FullscreenOverlayContainer, OverlayContainer } from '@angular/cdk/overlay'
import { DialogModule } from '@angular/cdk/dialog'
import { IonApp, IonButton, IonButtons, IonContent, IonSplitPane } from '@ionic/angular/standalone'

@Component({
  standalone: true,
  selector: 'nw-buddy-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AeternumMapModule,
    AppMenuComponent,
    CommonModule,
    GlobalSearchInputComponent,
    IconsModule,
    LayoutModule,
    NwModule,
    RouterModule,
    TitleBarComponent,
    TooltipModule,
    UpdateAlertModule,
    IonApp,
    IonContent,
    IonSplitPane,
    IonButtons,
    IonButton,
  ],
  providers: [{ provide: OverlayContainer, useClass: FullscreenOverlayContainer }],
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
  protected langLoaded = false

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
    this.preferences.language
      .observe()
      .pipe(switchMap((locale) => this.translate.use(locale)))
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
    this.langLoaded = true
    this.cdRef.markForCheck()
    this.removeLoader()
  }

  private removeLoader() {
    this.document.querySelectorAll('[data-skeleton]').forEach((el) => {
      setTimeout(() => {
        el.classList.remove('opacity-100')
        el.classList.add('opacity-0')
        setTimeout(() => el.remove(), 300)
      }, 750)
    })
  }
}
