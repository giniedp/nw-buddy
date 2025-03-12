import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { EmoteDetailModule } from '~/widgets/data/emote-detail'

@Component({
  selector: 'nwb-emotes-detail-page',
  templateUrl: './emotes-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule, EmoteDetailModule],
  host: {
    class: 'block',
  },
})
export class EmotesDetailPageComponent {
  protected route = inject(ActivatedRoute)
  protected id$ = observeRouteParam(this.route, 'id')
  protected showLocked: boolean
}
