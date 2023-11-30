import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, inject } from '@angular/core'
import { combineLatest } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { ModifierTipComponent } from './modifier-tip.component'
import { toSignal } from '@angular/core/rxjs-interop'
import { FlashDirective } from './utils/flash.directive'

@Component({
  standalone: true,
  selector: 'nwb-vitality-stats',
  templateUrl: './vitality-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
  },
})
export class VitalityStatsComponent {

  private mannequin = inject(Mannequin)
  protected health = toSignal(this.mannequin.statHealth$)
  protected stamina = toSignal(this.mannequin.statStamina$)
  protected mana = toSignal(this.mannequin.statMana$)
  protected physicalRating = toSignal(this.mannequin.statRatingPhysical$)
  protected elementalRating = toSignal(this.mannequin.statRatingElemental$)

}
