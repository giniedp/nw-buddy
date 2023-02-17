import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2 } from '@angular/core'
import { groupBy, sumBy } from 'lodash'
import { map, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult } from '~/nw/mannequin/modifier'
import { damageTypeIcon } from '~/nw/weapon-types'
import { TooltipModule } from '~/ui/tooltip'
import { ModifierCapTipComponent } from './modifier-cap-tip.component'
import { ModifierTipComponent } from './modifier-tip.component'

@Component({
  standalone: true,
  selector: 'nwb-fortify-stats',
  templateUrl: './fortify-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierCapTipComponent, ModifierTipComponent],
  host: {
    class: 'block hidden',
  },
})
export class FortifyStatsComponent {
  protected trackBy = (i: number) => i
  protected vm$ = this.mannequin.statAbs$.pipe(
    map((data) => {
      return {
        DamageTypes: collect(data.DamageCategories),
        VitalsTypes: collect(data.VitalsCategories)
      }
    }),
    tap((it) => {
      if (it.DamageTypes.length || it.VitalsTypes.length) {
        this.renderer.removeClass(this.elRef.nativeElement, 'hidden')
      } else {
        this.renderer.addClass(this.elRef.nativeElement, 'hidden')
      }
    })
  )

  public constructor(
    private mannequin: Mannequin,
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {
    //
  }
}

function collect(data: Record<string, ModifierResult>) {
  const entires = Object.entries(data)
    .map(([key, entry]) => {
      return {
        category: key,
        source: entry.source,
        value: entry.value,
        capped: sumBy(entry.source, (it) => it.value * it.scale) > entry.value,
        icon: damageTypeIcon(key),
      }
    })
    .filter((it) => !!it.value)

  const groups = groupBy(entires, (it) => it.value)

  return Object.entries(groups).map(([value, entries]) => {
    return {
      value: Number(value),
      entries: entries,
    }
  })
}
