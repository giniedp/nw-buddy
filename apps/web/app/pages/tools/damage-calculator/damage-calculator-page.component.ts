import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { LayoutModule } from '~/ui/layout'

import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { DamageCalculatorComponent } from '~/widgets/damage-calculator'
import { PreferencesService } from '~/preferences'

@Component({
  standalone: true,
  selector: 'nwb-damage-calculator-page',
  templateUrl: './damage-calculator-page.component.html',
  host: {
    class: 'ion-page',
  },
  imports: [CommonModule, LayoutModule, DamageCalculatorComponent, IonSegment, IonSegmentButton],
})
export class DamageCalculatorPageComponent {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private preferences = inject(PreferencesService)
  protected initialState: any = null
  protected encodedState: string = null

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
}

function decodeState(state: string) {
  if (!state) {
    return null
  }
  try {
    return JSON.parse(atob(state))
  } catch (e) {
    console.error('Failed to decode state', e)
    return null
  }
}

function encodeState(state: any) {
  return btoa(JSON.stringify(state))
}
