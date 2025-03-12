import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CharacterStore, GearsetRecord, GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { GersetLoadoutSlotComponent } from './gearset-loadout-slot.component'

@Component({
  selector: 'nwb-gearset-loadout',
  templateUrl: './gearset-loadout.component.html',
  styleUrls: ['./gearset-loadout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GersetLoadoutSlotComponent, RouterModule],
  providers: [GearsetStore],
  host: {
    class: 'grid gap-x-3 gap-y-2',
  },
})
export class GearsetLoadoutItemComponent {
  private store = inject(GearsetStore)
  private char = inject(CharacterStore)

  @Input()
  public set geasrsetId(value: string) {
    this.store.connectGearsetDB(value)
  }

  @Input()
  public editable = false

  @Input()
  public slotMenuTemplate: TemplateRef<any>

  @Input()
  public buttonTemplate: TemplateRef<any>

  @Output()
  public delete = new EventEmitter<GearsetRecord>()

  @Output()
  public create = new EventEmitter<void>()

  protected get gearset() {
    return this.store.gearset()
  }
  protected get gearScore() {
    return this.store.gearScore()
  }

  public constructor() {
    this.store.connectLevel(this.char.level)
  }

  @Input()
  public set data(value: GearsetRecord) {
    this.store.connectGearset(value)
  }

  protected createClicked() {
    this.create.emit()
  }

  protected deleteClicked(gearset: GearsetRecord) {
    this.delete.emit(gearset)
  }
}
