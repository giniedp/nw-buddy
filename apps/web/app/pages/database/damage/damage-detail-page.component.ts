import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { DamageRowDetailModule } from '~/widgets/data/damage-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'

@Component({
  selector: 'nwb-damage-detail-page',
  templateUrl: './damage-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DamageRowDetailModule, FormsModule, LayoutModule, StatusEffectDetailModule],
  host: {
    class: 'block',
  },
})
export class DamageDetailPageComponent {
  protected idParam = toSignal(observeRouteParam(this.route, 'id'))
  protected table = computed(() => this.idParam()?.split('-')[0])
  protected rowId = computed(() => this.idParam()?.split('-')[1])
  protected showLocked: boolean
  public constructor(private route: ActivatedRoute) {
    //
  }
}
