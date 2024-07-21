import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule, Location } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  RendererStyleFlags2,
  computed,
  inject,
} from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { map, of, switchMap } from 'rxjs'

import { TranslateService } from './i18n'

import { FullscreenOverlayContainer, OverlayContainer } from '@angular/cdk/overlay'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { IonApp, IonButton, IonButtons, IonContent, IonRouterOutlet, IonSplitPane } from '@ionic/angular/standalone'
import { environment } from '../environments'
import { LANG_OPTIONS, LanguageOption } from './app-menu'
import { AppMenuComponent } from './app-menu.component'
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
console.debug('environment', environment)
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
    TooltipModule,
    UpdateAlertModule,
    IonApp,
    IonContent,
    IonSplitPane,
    IonButtons,
    IonButton,
    IonRouterOutlet,
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

  public get titleBadge() {
    return this.platform.env.badge
  }

  public get isOverwolf() {
    return this.platform.isOverwolf
  }

  public get isEmbed() {
    // TODO: pass in from router
    return this.window.location.href.split('/').some((it) => it === 'embed')
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

  private bindLanguage() {
    toObservable(this.langSelection)
      .pipe(switchMap((it) => this.translate.use(it.value)))
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.platform.isBrowser) {
          this.removeLoader()
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
    const result: string[] = this.router.url.split('/').filter((it) => !!it)
    if (!this.langSelection().isDefault) {
      result.shift()
    }
    if (!selection.isDefault) {
      result.unshift(selection.value)
    }
    if (!this.langSelection().isDefault) {
      result.unshift('..')
    }
    return result
  }
}
