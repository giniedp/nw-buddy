import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { tapDebug } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-attributes-stats',
  templateUrl: './attributes-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, TooltipModule],
  host: {
    class: 'block',
  },
})
export class AttributesStatsComponent {
  protected trackBy = (i: number) => i
  protected readonly vm$ = this.mannequin.activeAttributes$.pipe(tapDebug('attrs')).pipe(
    map((data) => {
      return [
        {
          label: 'ui_Strength_short',
          base: data.str.base,
          assigned: data.str.assigned,
          bonus: data.str.bonus,
          total: data.str.total,
          magnify: data.str.magnify,
        },
        {
          label: 'ui_Dexterity_short',
          base: data.dex.base,
          assigned: data.dex.assigned,
          bonus: data.dex.bonus,
          total: data.dex.total,
          magnify: data.dex.magnify,
        },
        {
          label: 'ui_Intelligence_short',
          base: data.int.base,
          assigned: data.int.assigned,
          bonus: data.int.bonus,
          total: data.int.total,
          magnify: data.int.magnify,
        },
        {
          label: 'ui_Focus_short',
          base: data.foc.base,
          assigned: data.foc.assigned,
          bonus: data.foc.bonus,
          total: data.foc.total,
          magnify: data.foc.magnify,
        },
        {
          label: 'ui_Constitution_short',
          base: data.con.base,
          assigned: data.con.assigned,
          bonus: data.con.bonus,
          total: data.con.total,
          magnify: data.con.magnify,
        },
      ]
    })
  )

  public constructor(private mannequin: Mannequin) {
    //
  }
}
