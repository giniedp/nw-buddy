import { CommonModule, Location } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  RendererStyleFlags2,
  computed,
  inject,
  signal,
} from '@angular/core'
import { Router, RouterModule, UrlSegment } from '@angular/router'
import { map, of, switchMap } from 'rxjs'
import { TranslateService } from './i18n'

import { FullscreenOverlayContainer, OverlayContainer } from '@angular/cdk/overlay'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { IonApp, IonButtons, IonContent, IonSplitPane } from '@ionic/angular/standalone'
import { environment } from '../environments'
import { LANG_OPTIONS, LanguageOption } from './app-menu'
import { AppMenuComponent } from './app-menu.component'
import { AuthComponent } from './auth/auth.component'
import { BackendService } from './data/backend'
import { NwModule } from './nw'
import { AppPreferencesService } from './preferences'
import { IconsModule } from './ui/icons'
import { svgChevronLeft, svgDiscord, svgGithub, svgMap } from './ui/icons/svg'
import { LayoutModule, LayoutService } from './ui/layout'
import { TooltipModule } from './ui/tooltip'
import { injectRouteParam, mapProp, selectSignal } from './utils'
import { injectCurrentUrl } from './utils/injection/current-url'
import { injectDocument } from './utils/injection/document'
import { injectWindow } from './utils/injection/window'
import { PlatformService } from './utils/services/platform.service'
import { AeternumMapModule } from './widgets/aeternum-map'
import { GlobalSearchInputComponent } from './widgets/search'
import { UpdateAlertModule, VersionService } from './widgets/update-alert'
import { AppSkeletonService } from './app-skeleton.service'
console.debug('environment', environment)
@Component({
  selector: 'nw-buddy-app',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
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
    TooltipModule,
    UpdateAlertModule,
    IonApp,
    IonContent,
    IonSplitPane,
    IonButtons,
    AuthComponent,
  ],
  providers: [{ provide: OverlayContainer, useClass: FullscreenOverlayContainer }],
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

  public get titleBadge() {
    return this.platform.env.badge
  }

  public get isOverwolf() {
    return this.platform.isOverwolf
  }

  public get isEmbed() {
    return this.platform.isEmbed
  }

  protected langOptions = LANG_OPTIONS
  protected langSelection = selectSignal(injectRouteParam('locale'), (it) => {
    return LANG_OPTIONS.find((lang) => lang.value === it) || LANG_OPTIONS.find((lang) => lang.isDefault)
  })
  protected langLabel = computed(() => this.langSelection().value.split('-')[0].toUpperCase())

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
  protected window = injectWindow()
  protected document = injectDocument()
  protected skeleton = inject(AppSkeletonService)
  protected location = inject(Location)
  protected currentUrl = selectSignal(injectCurrentUrl())
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
  protected backend = inject(BackendService)

  constructor(
    private preferences: AppPreferencesService,
    private platform: PlatformService,
    private translate: TranslateService,
    private layout: LayoutService,
    private version: VersionService,
    private router: Router,
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {
    this.bindLanguage()
    this.bindWatermark()
  }

  protected onBackClicked() {
    this.location.back()
  }

  private bindLanguage() {
    toObservable(this.langSelection)
      .pipe(switchMap((it) => this.translate.use(it.value)))
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.platform.isBrowser) {
          this.skeleton.remove()
        }
      })
  }

  private bindWatermark() {
    if (environment.watermarkImageUrl) {
      this.renderer.setStyle(
        this.elRef.nativeElement,
        '--nwb-watermark',
        `url("${environment.watermarkImageUrl}")`,
        RendererStyleFlags2.DashCase,
      )
    }
  }

  protected goToUrl(event: Event) {
    let url = (event.target as HTMLInputElement).value
    this.router.navigateByUrl(url)
  }

  protected getLangUrl(selection: LanguageOption) {
    const url = this.router.parseUrl(this.router.url)
    const segments = url.root.children['primary']?.segments
    if (!segments) {
      if (!selection.isDefault) {
        return ['/', selection.value]
      }
      return ['/']
    }

    if (!this.langSelection().isDefault) {
      segments.shift()
    }
    if (!selection.isDefault) {
      segments.unshift(new UrlSegment(selection.value, {}))
    }
    return url
  }

  protected onUserSignedIn(userId: string) {
    console.log('User signed in', userId)
  }

  protected onUserSignedOut(userId: string) {
    console.log('User signed out', userId)
  }
}
