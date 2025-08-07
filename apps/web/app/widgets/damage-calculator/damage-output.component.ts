import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, inject, model, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore } from './damage-calculator.store'
import { DamageIndicatorService } from './damage-indicator.service'
import { DamageMathComponent } from './expression'

export type OutputTabs = 'weapon' | 'affix' | 'dot'
@Component({
  selector: 'nwb-damage-output',
  templateUrl: './damage-output.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, DamageMathComponent, FormsModule],
  host: {
    class: 'flex flex-col gap-4 items-center',
  },
})
export class DamageOutputComponent {
  protected indicator = inject(DamageIndicatorService)
  protected store = inject(DamageCalculatorStore)
  protected get trace() {
    return this.store.output().trace
  }

  protected tab = signal<OutputTabs>('weapon')
  protected showCrit = model(false)
  protected showMitigation = model(true)
  protected showAccumulated = this.showCrit

  @HostListener('mouseleave')
  protected onMouseLeave() {
    this.indicator.value.set(null)
  }
}
