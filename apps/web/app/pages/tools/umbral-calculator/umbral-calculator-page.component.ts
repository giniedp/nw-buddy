import { CommonModule } from '@angular/common'
import { Component, computed, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectBreakpoint, selectSignal } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { ScreenshotModule } from '~/widgets/screenshot'
import { UMBRAL_MODULE, UmbralCalculatorDirective } from '~/widgets/umbral-calculator'

@Component({
  selector: 'nwb-umbral-calculator-page',
  templateUrl: './umbral-calculator-page.component.html',
  host: {
    class: 'ion-page',
  },
  imports: [CommonModule, LayoutModule, IconsModule, ScreenshotModule, TooltipModule, UMBRAL_MODULE],
  hostDirectives: [UmbralCalculatorDirective],
})
export class UmbralCalculatorPageComponent {
  protected platform = inject(PlatformService)
  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected showSidebar = computed(() => this.isLargeContent())
  protected showModal = computed(() => !this.isLargeContent())
  protected showModal$ = toObservable(this.showModal)

  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Umbral calculator',
    })
  }
}
