import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { DOCUMENT } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { Subject, take, takeUntil } from 'rxjs'
import { environment } from '../environments/environment'

import { ElectronService } from './electron'
import { TranslateService } from './i18n'

import { LANG_OPTIONS, MAIN_MENU } from './menu'
import { AppPreferencesService } from './preferences'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: {
    class: 'layout-frame layout-col layout-gap',
  },
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
})
export class AppComponent implements OnInit, OnDestroy {
  @HostBinding('class.is-electron')
  public get isElectron() {
    return this.electron.isElectron
  }

  @HostBinding('class.is-web')
  public get isWeb() {
    return environment.environment === 'WEB' || environment.environment === 'DEV'
  }

  public get language() {
    return this.preferences.language.get()
  }
  public set language(value: string) {
    this.preferences.language.set(value)
  }

  protected mainMenu = MAIN_MENU
  protected langOptions = LANG_OPTIONS
  protected langLoaded = false
  private destroy$ = new Subject<void>()

  constructor(
    private preferences: AppPreferencesService,
    private electron: ElectronService,
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT)
    private document: Document,
    private translate: TranslateService
  ) {
    if (this.isWeb) {
      document.body.classList.add('is-web')
    }
    if (this.isElectron) {
      document.body.classList.add('is-electron')
    }
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
