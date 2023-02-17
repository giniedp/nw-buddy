import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'

@Component({
  standalone: true,
  selector: 'nwb-attributes-stats',
  templateUrl: './attributes-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class AttributesStatsComponent {

  protected trackBy = (i: number) => i
  protected readonly vm$ = this.mannequin.activeAttributes$.pipe(
    map((data) => {
      return [
        {
          label: 'ui_Strength_short',
          base: data.str.base,
          assigned: data.str.assigned,
          bonus: data.str.bonus,
          total: data.str.total,
        },
        {
          label: 'ui_Dexterity_short',
          base: data.dex.base,
          assigned: data.dex.assigned,
          bonus: data.dex.bonus,
          total: data.dex.total,
        },
        {
          label: 'ui_Intelligence_short',
          base: data.int.base,
          assigned: data.int.assigned,
          bonus: data.int.bonus,
          total: data.int.total,
        },
        {
          label: 'ui_Focus_short',
          base: data.foc.base,
          assigned: data.foc.assigned,
          bonus: data.foc.bonus,
          total: data.foc.total,
        },
        {
          label: 'ui_Constitution_short',
          base: data.con.base,
          assigned: data.con.assigned,
          bonus: data.con.bonus,
          total: data.con.total,
        },
      ]
    })
  )

  public constructor(private mannequin: Mannequin) {
    //
  }
}
