import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule, DOCUMENT, Location } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, RendererStyleFlags2, computed, inject, signal } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { map, of, switchMap } from 'rxjs'

import { TranslateService } from './i18n'

import { FullscreenOverlayContainer, OverlayContainer } from '@angular/cdk/overlay'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { IonApp, IonButton, IonButtons, IonContent, IonSplitPane } from '@ionic/angular/standalone'
import { LANG_OPTIONS } from './app-menu'
import { AppMenuComponent } from './app-menu.component'
import { NwModule } from './nw'
import { AppPreferencesService } from './preferences'
import { TitleBarComponent } from './title-bar.component'
import { IconsModule } from './ui/icons'
import { svgChevronLeft, svgDiscord, svgGithub, svgMap } from './ui/icons/svg'
import { LayoutModule, LayoutService } from './ui/layout'
import { TooltipModule } from './ui/tooltip'
import { mapProp } from './utils'
import { injectCurrentUrl } from './utils/injection/current-url'
import { PlatformService } from './utils/services/platform.service'
import { AeternumMapModule } from './widgets/aeternum-map'
import { GlobalSearchInputComponent } from './widgets/search'
import { UpdateAlertModule, VersionService } from './widgets/update-alert'
import { environment } from '../environments'

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
    trigger('appear', [
      transition(':enter', [style({ opacity: 0 }), animate('0.15s ease-out', style({ opacity: 1 }))]),
    ]),
    trigger('backButton', [
      transition(':enter', [
        style({ width: 0, opacity: 0 }),
        animate('0.15s ease-out', style({ width: '*' })),
        animate('0.15s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ width: '*', opacity: '*' }),
        animate('0.15s ease-out', style({ opacity: 0 })),
        animate('0.15s ease-out', style({ width: 0 })),
      ]),
    ]),
    trigger('versionAlert', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('0.15s ease-out', style({ height: '*' })),
        animate('0.15s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ height: '*', opacity: '*' }),
        animate('0.15s ease-out', style({ opacity: 0 })),
        animate('0.15s ease-out', style({ height: 0 })),
      ]),
    ]),
  ],
  host: {
    '[class.is-embed]': 'isEmbed',
  },
})
export class AppComponent {
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
    }),
  )

  protected versionChanged = toSignal(this.version.versionChanged$)
  protected langLoaded = signal(false)
  protected document = inject(DOCUMENT)
  protected location = inject(Location)
  protected currentUrl = toSignal(injectCurrentUrl())
  protected canGoBack = computed(() => {
    this.currentUrl()
    if (this.isElectron || this.isOverwolf) {
      return !this.location.isCurrentPathEqualTo('/')
    }
    return false
  })

  protected mapIcon = svgMap
  protected mapActive = false
  protected mapCollapsed = false
  protected iconGithub = svgGithub
  protected iconDiscord = svgDiscord
  protected iconBack = svgChevronLeft

  constructor(
    private preferences: AppPreferencesService,
    private platform: PlatformService,
    translate: TranslateService,
    private layout: LayoutService,
    private version: VersionService,
    private router: Router,
    elRef: ElementRef<HTMLElement>,
    renderer: Renderer2,
  ) {
    this.preferences.language
      .observe()
      .pipe(switchMap((locale) => translate.use(locale)))
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.langLoaded.set(true)
        this.removeLoader()
      })

      if (environment.watermarkImageUrl) {
        renderer.setStyle(elRef.nativeElement, '--nwb-watermark', `url("${environment.watermarkImageUrl}")`, RendererStyleFlags2.DashCase)
      }
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

  protected onBackClicked() {
    this.location.back()
  }
}
