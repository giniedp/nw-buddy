import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'

import { GearsetRecord } from '~/data'
import { NwModule } from '~/nw'
import { GearsetLoadoutItemComponent } from './loadout-item.component'

@Component({
  selector: 'nwb-gearset-loadout-list',
  templateUrl: './loadout-list.component.html',
  styleUrls: ['./loadout-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GearsetLoadoutItemComponent],
  host: {
    class: 'layout-content layout-pad',
  },
})
export class GearsetLoadoutListComponent {
  @Input()
  public records: GearsetRecord[] = []

  @Output()
  public createClicked = new EventEmitter<void>()

  @Output()
  public deleteCliced = new EventEmitter<GearsetRecord>()

  protected async handleCreate() {
    this.createClicked.emit()
  }

  protected handleDelete(gearset: GearsetRecord) {
    this.deleteCliced.emit(gearset)
  }
}
