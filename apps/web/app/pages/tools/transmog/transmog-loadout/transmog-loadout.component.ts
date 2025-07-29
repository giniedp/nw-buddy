import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  input,
  model,
  output,
  TemplateRef,
} from '@angular/core'
import { RouterModule } from '@angular/router'

import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgBars, svgGlobe, svgTrashCan } from '~/ui/icons/svg'
import { EmptyComponent } from '~/widgets/empty'
import { TransmogLoadoutSlotComponent } from './transmog-loadout-slot.component'
import { TransmogRecord, TransmogStore } from '~/data/transmogs'

@Component({
  selector: 'nwb-transmog-loadout',
  templateUrl: './transmog-loadout.component.html',
  styleUrl: './transmog-loadout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TransmogLoadoutSlotComponent, RouterModule, IconsModule, CdkMenuModule],
  providers: [TransmogStore],
  host: {
    class: 'w-full',
  },
})
export class TransmogLoadoutComponent implements VirtualGridCellComponent<TransmogRecord> {
  public static buildGridOptions(): VirtualGridOptions<TransmogRecord> {
    return {
      height: 125,
      width: 490,
      cellDataView: TransmogLoadoutComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  private store = inject(TransmogStore)
  public record = model<TransmogRecord>(null)

  public delete = output<TransmogRecord>()
  public create = output<void>()

  public disableHead = input(false)

  @Input()
  public set data(value: TransmogRecord) {
    this.record.set(value)
  }
  @Input()
  public selected: boolean

  protected isLoaded = this.store.isLoaded
  protected isOwned = this.store.isOwned
  protected isSyncable = this.store.isSyncable
  protected isSynced = this.store.isSyncComplete
  protected isSyncComplete = this.store.isSyncComplete
  protected isSyncPending = this.store.isSyncPending
  protected isSyncConflict = this.store.isSyncConflict
  protected isPublished = this.store.isPublished
  protected menuIcon = svgBars
  protected deleteIcon = svgTrashCan
  protected iconGlobe = svgGlobe

  public constructor() {
    this.store.connectById(
      computed(() => {
        return {
          id: this.record()?.id,
          userId: this.record()?.userId,
        }
      }),
    )
  }
}
