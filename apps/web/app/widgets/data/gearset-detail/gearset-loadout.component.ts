import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core'
import { RouterModule } from '@angular/router'
import { gearScoreRelevantSlots, getAverageGearScore } from '@nw-data/common'
import { combineLatest, defer, map, of, switchMap } from 'rxjs'
import { CharacterStore, GearsetRecord, GearsetStore, ItemInstance, ItemInstancesDB } from '~/data'
import { NwModule } from '~/nw'
import { GersetLoadoutSlotComponent } from './gearset-loadout-slot.component'

@Component({
  standalone: true,
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
  @Input()
  public set geasrsetId(value: string) {
    this.store.loadById(value)
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
  public set data(value: GearsetRecord) {
    this.store.patchState({
      gearset: value,
      isLoading: false,
    })
  }

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
