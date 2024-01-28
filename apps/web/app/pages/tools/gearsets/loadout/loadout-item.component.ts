import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CharacterStore, GearsetRecord, GearsetSignalStore } from '~/data'
import { NwModule } from '~/nw'
import { GersetSquareSlotComponent } from '../slots'

@Component({
  standalone: true,
  selector: 'nwb-gearset-loadout-item',
  templateUrl: './loadout-item.component.html',
  styleUrls: ['./loadout-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GersetSquareSlotComponent, RouterModule],
  providers: [GearsetSignalStore],
})
export class GearsetLoadoutItemComponent {
  private store = inject(GearsetSignalStore)

  @Input()
  public set geasrsetId(value: string) {
    this.store.connectGearsetDB(value)
  }

  @Input()
  public disableHead = false

  @Output()
  public deleteClicked = new EventEmitter<GearsetRecord>()

  @Output()
  public createClicked = new EventEmitter<void>()

  protected get gearset() {
    return this.store.gearset()
  }

  protected get gearScore() {
    return this.store.gearScore()
  }

  protected get isLoaded() {
    return this.store.isLoaded()
  }

  public constructor(char: CharacterStore) {
    this.store.connectLevel(char.level$)
  }

  protected handleCreate() {
    this.createClicked.emit()
  }

  protected handleDelete(gearset: GearsetRecord) {
    this.deleteClicked.emit(gearset)
  }
}
