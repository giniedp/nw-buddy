import { CommonModule } from '@angular/common'
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-abilities-table',
  templateUrl: './abilities-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, DataTableModule],
  host: {
    class: 'layout-row',
  },
})
export class AbilitiesTableComponent implements OnInit {
  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'Abilities DB'
    })
  }

  public ngOnInit(): void {
    //
  }
}
