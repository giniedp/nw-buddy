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
import { CharacterStore, GearsetRecord, GearsetRow, GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgBars, svgGlobe, svgTrashCan } from '~/ui/icons/svg'
import { SyncBadgeComponent } from '~/ui/sync-badge'
import { EmptyComponent } from '~/widgets/empty'
import { GearsetLoadoutSlotComponent } from './gearset-loadout-slot.component'

@Component({
  selector: 'nwb-gearset-loadout',
  templateUrl: './gearset-loadout.component.html',
  styleUrl: './gearset-loadout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    GearsetLoadoutSlotComponent,
    RouterModule,
    IconsModule,
    CdkMenuModule,
    SyncBadgeComponent,
  ],
  providers: [GearsetStore],
  host: {
    class: 'w-full',
  },
})
export class GearsetLoadoutComponent implements VirtualGridCellComponent<GearsetRow> {
  public static buildGridOptions(): VirtualGridOptions<GearsetRow> {
    return {
      height: 284,
      width: 490,
      cellDataView: GearsetLoadoutComponent,
      cellEmptyView: EmptyComponent,
    }
  }
  private store = inject(GearsetStore)
  private char = inject(CharacterStore)

  public gearset = model<GearsetRecord>(null)

  public slotMenuTemplate = input<TemplateRef<GearsetRecord>>(null)
  public buttonTemplate = input<TemplateRef<GearsetRecord>>(null)
  public delete = output<GearsetRecord>()
  public create = output<void>()

  public disableHead = input(false)

  @Input()
  public set data(value: GearsetRow) {
    this.gearset.set(value.record)
  }
  @Input()
  public selected: boolean

  protected gearScore = this.store.gearScore
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
    this.store.connectLevel(this.char.level)
    this.store.connectGearsetId(
      computed(() => {
        return {
          id: this.gearset()?.id,
          userId: this.gearset()?.userId,
        }
      }),
    )
  }
}
