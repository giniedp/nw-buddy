import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { ModifierTipComponent } from './ui/modifier-tip.component'
import { FlashDirective } from './ui/flash.directive'

@Component({
  selector: 'nwb-gear-cell-vitality',
  templateUrl: './gear-cell-vitality.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
  },
})
export class GearCellVitalityComponent {
  private mannequin = inject(Mannequin)
  protected health = this.mannequin.modMaxHealth
  protected stamina = this.mannequin.modMaxStamina
  protected mana = this.mannequin.modMaxMana
  protected physicalRating = this.mannequin.statRatingPhysical
  protected elementalRating = this.mannequin.statRatingElemental
}
