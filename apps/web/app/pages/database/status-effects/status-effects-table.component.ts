import { CommonModule } from '@angular/common'
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'

@Component({
  standalone: true,
  selector: 'nwb-status-effects-table',
  templateUrl: './status-effects-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule],
  host: {
    class: 'layout-col xl:flex-row',
  },
})
export class StatusEffectsTableComponent implements OnInit {
  public constructor(public readonly search: QuicksearchService) {
    //
  }

  public ngOnInit(): void {
    //
  }
}
