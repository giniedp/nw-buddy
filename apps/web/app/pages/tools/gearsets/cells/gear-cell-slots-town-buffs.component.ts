import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { EQUIP_SLOTS, EquipSlot, getStatusEffectTownBuffIds } from '@nw-data/common'
import { GearsetSignalStore, ItemInstance } from '~/data'
import { NwModule } from '~/nw'
import { GearCellSlotComponent } from './gear-cell-slot.component'
import { GearCellSlotEffectComponent } from './gear-cell-slot-effect.component'

@Component({
  standalone: true,
  selector: 'nwb-gear-cell-slots-town-buffs',
  templateUrl: './gear-cell-slots-town-buffs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GearCellSlotComponent, GearCellSlotEffectComponent],
  host: {
    class: 'block',
    '[class.hidden]': 'isEmpty() && disabled',
    '[class.screenshot-hidden]': 'isEmpty()',
  },
})
export class GearCellSlotsTownBuffsComponent {
  @Input()
  public hideTitle = false

  @Input()
  public disabled = false

  private store = inject(GearsetSignalStore)

  protected effects = getStatusEffectTownBuffIds()
  protected slots = computed(() => {
    let effects = this.store.gearset()?.enforceEffects
    effects = [...(effects || [])]
    effects = effects.filter((it) => !!it.stack && this.effects.some((id) => it.id === id))
    const result = [...effects]
    result.length = Math.min(effects.length + 1, 9)
    return result
  })
  protected isEmpty = computed(() => {
    return this.slots().every((it) => !it)
  })
  protected get gearset() {
    return this.store.gearset()
  }

  protected handleEffectChange(data: Array<{ id: string; stack: number}>) {
    this.store.updateStatusEffects(data)
  }
}
