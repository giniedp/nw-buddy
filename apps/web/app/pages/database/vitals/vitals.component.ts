import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { VitalsTableAdapter } from '~/widgets/adapter'

@Component({
  standalone: true,
  selector: 'nwb-vitals-page',
  templateUrl: './vitals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, DataTableModule, QuicksearchModule, NavToolbarModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
  providers: [VitalsTableAdapter.provider(), QuicksearchService],
})
export class VitalsComponent {}
