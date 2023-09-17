import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-loot-detail-page',
  templateUrl: './loot-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LootModule, FormsModule, LayoutModule],
  host: {
    class: 'flex-1 flex flex-col',
  },
})
export class LootDetailPageComponent {
  protected id$ = observeRouteParam(this.route, 'id')
  protected showLocked: boolean
  public constructor(private route: ActivatedRoute) {
    //
  }
}
