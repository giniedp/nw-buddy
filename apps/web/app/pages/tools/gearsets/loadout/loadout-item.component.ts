import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CharacterStore, GearsetRecord, GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgBars, svgGlobe, svgTrashCan } from '~/ui/icons/svg'
import { GersetSquareSlotComponent } from './square-slot.component'

@Component({
  selector: 'nwb-gearset-loadout-item',
  templateUrl: './loadout-item.component.html',
  styleUrls: ['./loadout-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GersetSquareSlotComponent, RouterModule, IconsModule, CdkMenuModule],
  providers: [GearsetStore],
})
export class GearsetLoadoutItemComponent {
  private store = inject(GearsetStore)
  private char = inject(CharacterStore)

  public gearset = input<GearsetRecord>(null)

  public disableHead = input(false)
  public deleteClicked = output<GearsetRecord>()
  public createClicked = output<void>()

  protected gearScore = this.store.gearScore
  protected isLoaded = this.store.isLoaded
  protected isOwned = this.store.isOwned
  protected isSyncable= this.store.isSyncable
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
    this.store.connectGearset(this.gearset)
  }

  protected handleCreate() {
    this.createClicked.emit()
  }

  protected handleDelete(gearset: GearsetRecord) {
    this.deleteClicked.emit(gearset)
  }
}
