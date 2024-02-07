import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { getWeightLabel } from '@nw-data/common'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { FlashDirective } from './ui/flash.directive'

@Component({
  standalone: true,
  selector: 'nwb-gear-cell-equip-load',
  templateUrl: './gear-cell-equip-load.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FlashDirective],
  host: {
    class: 'block',
  },
})
export class GearCellEquipLoadComponent {

  @Input()
  public hideTitle = false

  private mannequin = inject(Mannequin)
  protected weight = this.mannequin.equipLoad
  protected weightLabel = computed(() => getWeightLabel(this.weight()))
  protected healing = computed(() => {
    if (!this.weight()) {
      return 0
    }
    return this.weightLabel() === 'light' ? 0.3 : this.weightLabel() === 'medium' ? 0 : -0.3
  })
  protected damage = computed(() => {
    if (!this.weight()) {
      return 0
    }
    return this.weightLabel() === 'light' ? 0.2 : this.weightLabel() === 'medium' ? 0.1 : 0
  })
}
