import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { BackstoryDetailModule } from '~/widgets/data/backstory-detail'
import { EmoteDetailModule } from '~/widgets/data/emote-detail'

@Component({
  standalone: true,
  selector: 'nwb-backstories-detail-page',
  templateUrl: './backstories-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule, BackstoryDetailModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class BackstoriesDetailPageComponent {
  protected route = inject(ActivatedRoute)
  protected id$ = observeRouteParam(this.route, 'id')
  protected showLocked: boolean
}
