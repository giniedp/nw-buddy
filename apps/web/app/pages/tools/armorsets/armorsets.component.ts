import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, TrackByFunction } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ItemDefinitionMaster } from '@nw-data/types'
import { NwModule } from '~/nw'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ScreenshotModule } from '~/widgets/screenshot'
import { ArmorsetsAdapterService } from './armorsets-adapter.service'
import { Armorset } from './types'

@Component({
  standalone: true,
  selector: 'nwb-armorsets',
  templateUrl: './armorsets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, DataTableModule, QuicksearchModule, ScreenshotModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
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
