import { CommonModule } from '@angular/common'
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-vitals-table',
  templateUrl: './vitals-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, DataTableModule],
  host: {
    class: 'layout-row',
  },
})
export class VitalsTableComponent implements OnInit {
  public constructor(public readonly search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'Vitals & Creatures DB'
    })
  }

  public ngOnInit(): void {
    //
  }
}
