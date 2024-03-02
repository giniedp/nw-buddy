import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { LayoutModule } from '~/ui/layout'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { IonSegment, IonSegmentButton, IonToast, ToastController } from '@ionic/angular/standalone'
import { PreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgClipboard, svgLink } from '~/ui/icons/svg'
import { DamageCalculatorComponent } from '~/widgets/damage-calculator'
import { ScreenshotModule } from '~/widgets/screenshot'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
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
    IonSegment,
    IonSegmentButton,
    IonToast,
    ScreenshotModule,
    TooltipModule
  ],
})
export class DamageCalculatorPageComponent {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private toast = inject(ToastController)
  private preferences = inject(PreferencesService)

  protected initialState: any = null
  protected encodedState: string = null
  protected iconLink = svgLink
  protected iconLog = svgClipboard
  protected showLog = false

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
    const url = new URL(this.router.url, location.origin)
    url.searchParams.set('state', this.encodedState)
    navigator.clipboard.writeText(url.toString())
    this.toast
      .create({
        message: 'Copied link to clipboard',
        duration: 2000,
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
