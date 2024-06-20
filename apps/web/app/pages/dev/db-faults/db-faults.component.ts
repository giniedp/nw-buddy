import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { DataGridModule } from '~/ui/data/table-grid'
import { DataViewModule, provideDataView } from '~/ui/data/data-view'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { DbFaultsTableAdapter } from './db-faults-adapter'

export interface FaultRow {
  item: MasterItemDefinitions
  gemFault: boolean
  inherentFault: boolean
  generatedFault: boolean
  perks: Array<{
    ok: boolean
    perk: PerkData
  }>
}

@Component({
  standalone: true,
  selector: 'nwb-db-faults-page',
  templateUrl: './db-faults.component.html',
  styleUrls: ['./db-faults.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, QuicksearchModule, DataGridModule, DataViewModule],
  providers: [
    provideDataView({
      adapter: DbFaultsTableAdapter,
    }),
    QuicksearchService,
  ],
  host: {
    class: 'layout-col bg-base-100',
  },
})
export class DbFaultsComponent {}
