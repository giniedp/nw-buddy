import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { patchState } from '@ngrx/signals'
import { CharacterStore, GearsetRecord, GearsetRow, GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { EmptyComponent } from '~/widgets/empty'
import { GersetSquareSlotComponent } from './gearset-cell-slot.component'
import { GearsetTableRecord } from './gearset-table-cols'

@Component({
  standalone: true,
  selector: 'nwb-gearset-cell',
  templateUrl: './gearset-cell.component.html',
  styleUrls: ['./gearset-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GersetSquareSlotComponent, RouterModule],
  providers: [GearsetStore],
})
export class GearsetLoadoutItemComponent implements VirtualGridCellComponent<GearsetTableRecord> {
  public static buildGridOptions(): VirtualGridOptions<GearsetTableRecord> {
    return {
      height: 256,
      width: 490,
      cellDataView: GearsetLoadoutItemComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  protected store = inject(GearsetStore)

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

  public constructor(char: CharacterStore) {
    this.store.connectLevel(char.level$)
  }

  @Input()
  public set data(value: GearsetRow) {
    patchState(this.store, {
      gearset: value.record,
      isLoaded: true,
    })
  }

  @Input()
  public selected: boolean

  protected handleCreate() {
    this.create.emit()
  }

  protected handleDelete(gearset: GearsetRecord) {
    this.delete.emit(gearset)
  }
}
