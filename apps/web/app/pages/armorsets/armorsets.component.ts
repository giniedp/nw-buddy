import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, TrackByFunction } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { DataTableAdapter, DataTableComponent } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { ArmorsetsAdapterService } from './armorsets-adapter.service'
import { Armorset, ArmorsetGroup } from './types'

@Component({
  selector: 'nwb-armorsets',
  templateUrl: './armorsets.component.html',
  styleUrls: ['./armorsets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
  providers: [DataTableAdapter.provideClass(ArmorsetsAdapterService), QuicksearchService],
})
export class ArmorsetsComponent {
  public selection: ItemDefinitionMaster[]
  public trackByIndex: TrackByFunction<any> = (i) => i
  public constructor(private cdRef: ChangeDetectorRef, private zone: NgZone) {
    //
  }
  public selectionChanged(selection: Armorset[]) {
    this.zone.run(() => {
      this.selection = selection[0]?.items || []
      this.cdRef.markForCheck()
    })
  }
}
