import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2 } from '@angular/core'
import { combineLatest } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { ModifierTipComponent } from './modifier-tip.component'

@Component({
  standalone: true,
  selector: 'nwb-vitality-stats',
  templateUrl: './vitality-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent],
  host: {
    class: 'block',
  },
})
export class VitalityStatsComponent {

  protected trackBy = (i: number) => i
  protected vm$ = combineLatest({
    health: this.mannequin.statHealth$,
    stamina: this.mannequin.statStamina$,
    mana: this.mannequin.statMana$,
    physicalRating: this.mannequin.statRatingPhysical$,
    elementalRating: this.mannequin.statRatingElemental$,
  })

  public constructor(private mannequin: Mannequin, private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {
    //

  }
}
