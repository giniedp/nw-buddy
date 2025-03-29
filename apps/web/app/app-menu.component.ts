import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { DomSanitizer } from '@angular/platform-browser'
import { RouterModule } from '@angular/router'
import { IonSegment, IonSegmentButton, IonToolbar, SegmentCustomEvent } from '@ionic/angular/standalone'
import { patchState, signalState } from '@ngrx/signals'
import { map } from 'rxjs'
import { NW_BUDDY_LIVE, NW_BUDDY_PTR, environment } from '../environments'
import { APP_MENU } from './app-menu'
import { LocaleService } from './i18n'
import { NwLinkService, NwModule } from './nw'
import { IconsModule } from './ui/icons'
import { svgChevronLeft } from './ui/icons/svg'
import { LayoutModule } from './ui/layout'
import { MenuCloseDirective } from './ui/layout/menu.directive'
import { injectCurrentUrl } from './utils/injection/current-url'

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    RouterModule,
    LayoutModule,
    IonToolbar,
    IonSegment,
    IonSegmentButton,
    MenuCloseDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ion-page',
  },
})
export class AppMenuComponent {
  protected link = inject(NwLinkService)
  private sanitizer = inject(DomSanitizer)
  private localeService = inject(LocaleService)

  protected get showPtrSwitch() {
    return (this.isLive || this.isPTR) && !environment.standalone
  }

  protected get showBranchName() {
    return !environment.standalone
  }

  protected get branchName() {
    return environment.branchname
  }

  protected get isLive() {
    return this.branchName === 'live'
  }

  protected get isPTR() {
    return this.branchName === 'ptr'
  }

  protected ptrUrl = toSignal(
    injectCurrentUrl().pipe(map((it) => this.sanitizer.bypassSecurityTrustUrl(NW_BUDDY_PTR + it))),
  )
  protected liveUrl = toSignal(
    injectCurrentUrl().pipe(map((it) => this.sanitizer.bypassSecurityTrustUrl(NW_BUDDY_LIVE + it))),
  )

  protected get version() {
    return environment.version?.split('#')?.[0]
  }

  private state = signalState({
    menu: APP_MENU,
    active: APP_MENU[0].category,
  })

  protected get menu() {
    return this.state.menu()
  }

  protected get active() {
    return this.state.active()
  }

  protected get locale() {
    return this.localeService.value()
  }

  protected readonly chevronIcon = svgChevronLeft

  protected onGroupActive(category: string) {
    patchState(this.state, { active: category })
  }

  protected handleSegmentChange(event: SegmentCustomEvent) {
    patchState(this.state, { active: event.detail.value as any })
  }
}
