import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, ElementRef, computed, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { selectStream } from '~/utils'
import { getWeightLabel } from '@nw-data/common'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'
import { FlashDirective } from './utils/flash.directive'

@Component({
  standalone: true,
  selector: 'nwb-equip-load-stats',
  templateUrl: './equip-load-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FlashDirective],
  host: {
    class: 'block',
  },
})
export class EquipLoadStatsComponent {

  private mannequin = inject(Mannequin)
  protected weight = toSignal(this.mannequin.equipLoad$)
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
