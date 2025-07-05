import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, TemplateRef, inject, input, output } from '@angular/core'
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

  public gearsetId = input<string>(null)
  public editable = input(false)

  public slotMenuTemplate = input<TemplateRef<any>>(null)
  public buttonTemplate = input<TemplateRef<any>>(null)
  public delete = output<GearsetRecord>()
  public create = output<void>()

  protected gearset = this.store.gearset
  protected gearScore = this.store.gearScore

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
