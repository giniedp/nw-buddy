import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, computed, inject } from '@angular/core'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { ModifierTipComponent } from './modifier-tip.component'
import { LIST_COUNT_ANIMATION } from './utils/animation'
import { FlashDirective } from './utils/flash.directive'

@Component({
  standalone: true,
  selector: 'nwb-luck-stats',
  templateUrl: './luck-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  animations: [LIST_COUNT_ANIMATION],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class LuckStatsComponent {
  private mannequin = inject(Mannequin)
  protected rowCount = computed(() => this.rows()?.length)
  protected rows = selectSignal(
    {
      stats: this.mannequin.statRol$,
    },
    (({ stats }) => {
      return Object.entries(stats || {})
        .map(([key, entry]) => {
          return {
            category: key,
            source: entry.source,
            value: entry.value,
          }
        })
        .filter((it) => !!it.value)
    }),
  )

}
