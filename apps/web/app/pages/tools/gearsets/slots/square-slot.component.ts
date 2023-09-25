import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, map } from 'rxjs'
import { GearsetRecord, GearsetSlotStore } from '~/data'
import { NwModule } from '~/nw'
import { EquipSlot, EquipSlotId, EQUIP_SLOTS, getItemId } from '@nw-data/common'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgPlus } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'

export interface GearsetSquareSlotState {
  slot: EquipSlot
  gearset: GearsetRecord
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-square-slot',
  templateUrl: './square-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, IconsModule, CdkMenuModule, TooltipModule],
  providers: [GearsetSlotStore],
  host: {
    class: 'inline-block rounded-md overflow-clip',
  },
})
export class GersetSquareSlotComponent extends ComponentStore<GearsetSquareSlotState> {
  @Input()
  public set slotId(value: EquipSlotId) {
    this.patchState({ slot: EQUIP_SLOTS.find((it) => it.id === value) })
  }

  @Input()
  public set gearset(value: GearsetRecord) {
    this.patchState({ gearset: value })
  }

  @Input()
  public disabled: boolean

  @Output()
  public pickItem = new EventEmitter<EquipSlotId>()

  @Input()
  public menuTemplate: TemplateRef<any>

  protected iconPlus = svgPlus
  protected iconMenu = svgEllipsisVertical

  protected vm$ = combineLatest({
    item: this.store.item$,
    instance: this.store.instance$,
    rarity: this.store.rarity$,
    isNamed: this.store.isNamed$,
    isArtifact: this.store.isArtifact$,
    itemId: this.store.item$.pipe(map((it) => getItemId(it))),
    slot: this.state$.pipe(map((it) => it.slot)),
  })

  public constructor(private store: GearsetSlotStore) {
    super({
      gearset: null,
      slot: null,
    })
    this.store.useSlot(this.state$)
  }

  protected pickItemClicked() {
    if (!this.disabled) {
      this.pickItem.emit(this.get((it) => it.slot.id))
    }
  }
}
