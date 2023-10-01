import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { RouterModule } from '@angular/router'
import { combineLatest, defer, map, of, switchMap } from 'rxjs'
import {
  CharacterStore,
  GearsetRecord,
  GearsetRow,
  GearsetStore,
  ItemInstance,
  ItemInstanceRecord,
  ItemInstancesDB,
} from '~/data'
import { NwModule } from '~/nw'
import { gearScoreRelevantSlots, getAverageGearScore } from '@nw-data/common'
import { GersetSquareSlotComponent } from './gearset-cell-slot.component'
import { VirtualGridCellComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { GearsetTableRecord } from './gearset-table-cols'
import { EmptyComponent } from '~/widgets/empty'

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

  @Input()
  public set geasrsetId(value: string) {
    this.store.loadById(value)
  }

  @Output()
  public delete = new EventEmitter<GearsetRecord>()

  @Output()
  public create = new EventEmitter<void>()

  protected vm$ = combineLatest({
    id: this.store.gearsetId$,
    name: this.store.gearsetName$,
    gearset: this.store.gearset$,
    isLoading: this.store.isLoading$,
    gearscore: defer(() => this.gearscore$),
  })

  private readonly gearscore$ = combineLatest({
    level: this.char.level$,
    slots: this.store.gearset$.pipe(switchMap((it) => this.selectGearscoreSlots(it))),
  }).pipe(map(({ level, slots }) => getAverageGearScore(slots, level)))

  public constructor(private char: CharacterStore, private itemsDb: ItemInstancesDB, private store: GearsetStore) {
    // store.gearsetSlots$
  }

  @Input()
  public set data(value: GearsetRow) {
    this.store.patchState({
      gearset: value.record,
      isLoading: false,
    })
  }

  @Input()
  public selected: boolean

  protected createClicked() {
    this.create.emit()
  }

  protected deleteClicked(gearset: GearsetRecord) {
    this.delete.emit(gearset)
  }

  private selectGearscoreSlots(record: GearsetRecord) {
    return combineLatest(
      gearScoreRelevantSlots().map((slot) => {
        return this.resolveItemInstance(record?.slots?.[slot.id]).pipe(
          map((instance) => {
            return {
              ...slot,
              gearScore: instance?.gearScore || 0,
            }
          })
        )
      })
    )
  }

  private resolveItemInstance(itemInstance: string | ItemInstance) {
    if (!itemInstance) {
      return of(null)
    }
    if (typeof itemInstance === 'string') {
      return this.itemsDb.live((t) => t.get(itemInstance))
    }
    return of(itemInstance)
  }
}
