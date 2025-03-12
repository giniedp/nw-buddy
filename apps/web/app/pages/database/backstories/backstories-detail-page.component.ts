import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { injectRouteParam, observeRouteParam } from '~/utils'
import { BackstoryDetailModule } from '~/widgets/data/backstory-detail'

@Component({
  selector: 'nwb-backstories-detail-page',
  templateUrl: './backstories-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule, BackstoryDetailModule],
  host: {
    class: 'block',
  },
})
export class BackstoriesDetailPageComponent {
  protected route = inject(ActivatedRoute)
  protected itemId = toSignal(injectRouteParam('id'))
  protected showLocked: boolean
}
