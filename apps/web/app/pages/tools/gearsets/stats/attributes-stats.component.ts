import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { ActiveAttribute, Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { FlashDirective } from './utils/flash.directive'

@Component({
  standalone: true,
  selector: 'nwb-attributes-stats',
  templateUrl: './attributes-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, TooltipModule, FlashDirective],
  host: {
    class: 'block',
  },
})
export class AttributesStatsComponent {
  private mannequin = inject(Mannequin)
  protected attributes = selectSignal(
    {
      attributes: this.mannequin.activeAttributes$,
    },
    (({ attributes }) => {
      return [
        {
          label: 'ui_Strength_short',
          ...buildRow(attributes?.str),
        },
        {
          label: 'ui_Dexterity_short',
          ...buildRow(attributes?.dex),
        },
        {
          label: 'ui_Intelligence_short',
          ...buildRow(attributes?.int),
        },
        {
          label: 'ui_Focus_short',
          ...buildRow(attributes?.foc),
        },
        {
          label: 'ui_Constitution_short',
          ...buildRow(attributes?.con),
        },
      ]
    }),
  )
}

function buildRow(attr: ActiveAttribute) {
  return {
    base: attr?.base ?? 0,
    assigned: attr?.assigned ?? 0,
    bonus: attr?.bonus ?? 0,
    total: attr?.total ?? 0,
    magnify: attr?.magnify ?? 0,
  }
}
