import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import {
  NW_EQUIP_LOAD_DAMAGE_MULT_FAST,
  NW_EQUIP_LOAD_DAMAGE_MULT_NORMAL,
  NW_EQUIP_LOAD_DAMAGE_MULT_SLOW,
  NW_EQUIP_LOAD_HEAL_MULT_FAST,
  NW_EQUIP_LOAD_HEAL_MULT_NORMAL,
  NW_EQUIP_LOAD_HEAL_MULT_SLOW,
  getWeightLabel,
} from '@nw-data/common'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { FlashDirective } from './ui/flash.directive'

@Component({
  selector: 'nwb-gear-cell-equip-load',
  templateUrl: './gear-cell-equip-load.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FlashDirective],
  host: {
    class: 'block',
  },
})
export class GearCellEquipLoadComponent {
  public hideTitle = input(false)

  private mannequin = inject(Mannequin)
  protected weight = this.mannequin.equipLoad
  protected weightLabel = computed(() => getWeightLabel(this.weight()))
  protected healing = computed(() => {
    if (this.weightLabel() === 'light') {
      return NW_EQUIP_LOAD_HEAL_MULT_FAST - 1
    }
    if (this.weightLabel() === 'medium') {
      return NW_EQUIP_LOAD_HEAL_MULT_NORMAL - 1
    }
    if (this.weightLabel() === 'heavy') {
      return NW_EQUIP_LOAD_HEAL_MULT_SLOW - 1
    }
    return 0
  })
  protected damage = computed(() => {
    if (this.weightLabel() === 'light') {
      return NW_EQUIP_LOAD_DAMAGE_MULT_FAST
    }
    if (this.weightLabel() === 'medium') {
      return NW_EQUIP_LOAD_DAMAGE_MULT_NORMAL
    }
    if (this.weightLabel() === 'heavy') {
      return NW_EQUIP_LOAD_DAMAGE_MULT_SLOW
    }
    return 0
  })
}
