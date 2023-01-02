import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-loot-limits-table',
  templateUrl: './loot-limits-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DataTableModule, RouterModule],
  host: {
    class: 'layout-row',
  },
})
export class LootLimitsTableComponent {
  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'Loot Limits DB',
    })
  }
}
