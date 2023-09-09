import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, ElementRef } from '@angular/core'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { selectStream } from '~/utils'
import { getWeightLabel } from '@nw-data/common'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'

@Component({
  standalone: true,
  selector: 'nwb-equip-load-stats',
  templateUrl: './equip-load-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content',
  },
})
export class EquipLoadStatsComponent {
  protected trackBy = (i: number) => i
  protected vm$ = selectStream(this.mannequin.equipLoad$, (weight) => {
    const load = getWeightLabel(weight)
    return {
      weight,
      load,
      healing: load === 'light' ? 0.3 : load === 'medium' ? 0 : -0.3,
      damage: load === 'light' ? 0.2 : load === 'medium' ? 0.1 : 0,
    }
  })
  protected load$ = toSignal(this.mannequin.equipLoad$.pipe(map(getWeightLabel)))

  public constructor(private mannequin: Mannequin) {
    mannequin.equipLoad$
  }
}
