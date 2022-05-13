import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core'
import { DataTableAdapter, DataTableComponent } from '~/ui/data-table'
import { ArmorsetsAdapterService } from './armorsets-adapter.service'
import { Armorset, ArmorsetGroup } from './types'

@Component({
  selector: 'nwb-armorsets',
  templateUrl: './armorsets.component.html',
  styleUrls: ['./armorsets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
  providers: [DataTableAdapter.provideClass(ArmorsetsAdapterService)],
})
export class ArmorsetsComponent {

  public selectedIds: string[]

  public constructor(private cdRef: ChangeDetectorRef) {
    //
  }
  public selectionChanged(table: DataTableComponent<Armorset>) {
    this.selectedIds = table.grid.api.getSelectedNodes()?.map((it) => it.data as Armorset)[0]?.items?.map((it) => it.ItemID)
    this.cdRef.markForCheck()
  }
}
