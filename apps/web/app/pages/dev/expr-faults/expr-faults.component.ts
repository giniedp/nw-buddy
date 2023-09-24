import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Perks } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { DataGridModule } from '~/ui/data/table-grid'
import { DataViewModule, provideDataView } from '~/ui/data/data-view'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ExprFaultsAdapter } from './expr-faults-adapter'

export interface FaultRow {
  perk: Perks
  expressions: Array<{
    lang: string
    text: string
    expr: string
  }>
}

const KNOWN_LANG = [
  { value: 'en-us', label: 'EN' },
  { value: 'de-de', label: 'DE' },
  { value: 'es-es', label: 'ES' },
  { value: 'fr-fr', label: 'FR' },
  { value: 'it-it', label: 'IT' },
  { value: 'pl-pl', label: 'PL' },
  { value: 'pt-br', label: 'BR' },
]

@Component({
  standalone: true,
  selector: 'nwb-expr-faults-page',
  templateUrl: './expr-faults.component.html',
  styleUrls: ['./expr-faults.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, QuicksearchModule, DataGridModule, DataViewModule],
  host: {
    class: 'layout-col bg-base-100',
  },
  providers: [
    provideDataView({
      adapter: ExprFaultsAdapter,
    }),
    QuicksearchService,
  ],
})
export class ExprFaultsComponent {}
