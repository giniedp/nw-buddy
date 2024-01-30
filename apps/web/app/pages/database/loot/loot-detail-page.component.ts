import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam, selectSignal } from '~/utils'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-loot-detail-page',
  templateUrl: './loot-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, LootModule, FormsModule, LayoutModule],
  host: {
    class: 'block',
  },
})
export class LootDetailPageComponent {
  private db = inject(NwDataService)
  protected id$ = observeRouteParam(this.route, 'id')
  protected parents = selectSignal(this.db.lootTablesByLootTableId(this.id$), (it) => {
    return it ? Array.from(it.values()) : null
  })
  protected showLocked: boolean
  public constructor(private route: ActivatedRoute) {
    //
  }
}
