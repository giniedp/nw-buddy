import { CommonModule } from '@angular/common'
import { Component, computed, inject, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { ToastController } from '@ionic/angular/standalone'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { PreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgClipboard, svgFunction, svgLink } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { PlatformService } from '~/utils/services/platform.service'
import { DamageCalculatorComponent } from '~/widgets/damage-calculator'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SplitGutterComponent, SplitPaneDirective } from '../../../ui/split-container'
import { injectBreakpoint } from '../../../utils'

@Component({
  selector: 'nwb-damage-calculator-page',
  templateUrl: './damage-calculator-page.component.html',
  host: {
    class: 'ion-page',
  },
  imports: [
    CommonModule,
    LayoutModule,
    DamageCalculatorComponent,
    IconsModule,
    ScreenshotModule,
    TooltipModule,
    SplitPaneDirective,
    SplitGutterComponent,
  ],
})
export class DamageCalculatorPageComponent {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private toast = inject(ToastController)
  private preferences = inject(PreferencesService)
  private platform = inject(PlatformService)

  protected mediaBreak = toSignal(injectBreakpoint('(min-width: 1920px)'))
  protected isLargeContent = computed(() => this.platform.isServer || this.mediaBreak())
  protected isChildActive = signal(false)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())
  protected showModal$ = toObservable(this.showModal)

  protected initialState: any = null
  protected encodedState: string = null
  protected iconLink = svgLink
  protected iconFormula = svgFunction

  protected handleStateChange(value: any) {
    this.preferences.session.set('damage-calculator', value)
    this.encodedState = encodeState(value)
  }

  public constructor() {
    const queryState = decodeState(this.route.snapshot.queryParamMap.get('state'))
    const sessionState = this.preferences.session.get('damage-calculator')
    this.initialState = queryState || sessionState || null
    if (queryState) {
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: { state: null },
      })
    }
  }

  protected copyLink() {
    const url = new URL(this.router.url, this.platform.websiteUrl)
    url.searchParams.set('state', this.encodedState)
    navigator.clipboard.writeText(url.toString())
    this.toast
      .create({
        message: 'Link was copied to clipboard',
        duration: 2000,
        position: 'top',
      })
      .then((toast) => toast.present())
  }
}

function decodeState(state: string) {
  if (!state) {
    return null
  }
  try {
    return JSON.parse(decompressFromEncodedURIComponent(state))
  } catch (e) {
    console.error('Failed to decode state', e)
    return null
  }
}

function encodeState(state: any) {
  return compressToEncodedURIComponent(JSON.stringify(state))
}
