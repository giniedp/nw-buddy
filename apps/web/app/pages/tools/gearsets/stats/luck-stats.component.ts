import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2 } from '@angular/core'
import { map, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { ModifierTipComponent } from './modifier-tip.component'

@Component({
  standalone: true,
  selector: 'nwb-luck-stats',
  templateUrl: './luck-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent],
  host: {
    class: 'block hidden',
  },
})
export class LuckStatsComponent {

  protected trackBy = (i: number) => i
  protected vm$ = this.mannequin.statRol$.pipe(
    map((data) => {
      return Object.entries(data)
        .map(([key, entry]) => {
          return {
            category: key,
            source: entry.source,
            value: entry.value,
            // icon: damageTypeIcon(key),
          }
        })
        .filter((it) => !!it.value)
    }),
    tap((it) => {
      if (it?.length) {
        this.renderer.removeClass(this.elRef.nativeElement, 'hidden')
      } else {
        this.renderer.addClass(this.elRef.nativeElement, 'hidden')
      }
    })
  )


  public constructor(private mannequin: Mannequin, private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {
    //
  }
}
