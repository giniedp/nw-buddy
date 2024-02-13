import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { LayoutModule } from '~/ui/layout'
import { DamageCalculatorComponent } from './damage-calculator.component'

@Component({
  standalone: true,
  selector: 'nwb-damage-calculator-page',
  templateUrl: './damage-calculator-page.component.html',
  host: {
    class: 'ion-page',
  },
  imports: [CommonModule, LayoutModule, DamageCalculatorComponent],
})
export class DamageCalculatorPageComponent {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  protected queryState = decodeState(this.route.snapshot.queryParamMap.get('state'))

  protected handleStateChange(value: any) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: { state: encodeState(value) },
    })
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
