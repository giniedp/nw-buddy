import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { VitalsAdapterService } from './vitals-adapter.service'

@Component({
  selector: 'nwb-vitals',
  templateUrl: './vitals.component.html',
  styleUrls: ['./vitals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
  providers: [DataTableAdapter.provideClass(VitalsAdapterService)],
})
export class VitalsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
