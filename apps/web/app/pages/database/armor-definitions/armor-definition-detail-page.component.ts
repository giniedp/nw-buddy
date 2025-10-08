import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { injectRouteParam } from '../../../utils'
import { ArmorDefinitionDetailComponent } from '../../../widgets/data/armor-definition-detail'

@Component({
  selector: 'nwb-armor-definition-detail-page',
  templateUrl: './armor-definition-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, ArmorDefinitionDetailComponent],
  host: {
    class: 'block',
  },
})
export class WeaponDefinitionDetailPageComponent {
  protected recordId = toSignal(injectRouteParam('id'))
}
