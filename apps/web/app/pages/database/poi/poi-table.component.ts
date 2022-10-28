import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  standalone: true,
  selector: 'nwb-poi-table',
  templateUrl: './poi-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DataTableModule, RouterModule],
  //providers: [DataTableAdapter.provideClass(PoiTableAdapter)],
  host: {
    class: 'layout-row layout-gap',
  },
})
export class PoiTableComponent {
  public constructor(public search: QuicksearchService) {
    //
  }
}