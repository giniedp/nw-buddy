import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CharacterStore, GearsetRecord, GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { GersetSquareSlotComponent } from './square-slot.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset-loadout-item',
  templateUrl: './loadout-item.component.html',
  styleUrls: ['./loadout-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GersetSquareSlotComponent, RouterModule],
  providers: [GearsetStore],
})
export class GearsetLoadoutItemComponent {
  private store = inject(GearsetStore)

  @Input()
  public set geasrsetId(value: string) {
    this.store.connectGearsetDB(value)
  }
  public get gearsetId() {
    return this.store.gearset()?.id
  }k

  @Input()
  public set gearset(value: GearsetRecord) {
    this.store.connectGearset(value)
  }
  public get gearset() {
    return this.store.gearset()
  }

  @Input()
  public disableHead = false

  @Output()
  public deleteClicked = new EventEmitter<GearsetRecord>()

  @Output()
  public createClicked = new EventEmitter<void>()


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
