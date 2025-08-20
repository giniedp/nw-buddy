import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { FlashDirective } from './ui/flash.directive'
import { ModifierTipComponent } from './ui/modifier-tip.component'

@Component({
  selector: 'nwb-gear-cell-mods-crafting',
  templateUrl: './gear-cell-mods-crafting.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class GearCellModsCraftingComponent {
  private mannequin = inject(Mannequin)
  protected rowCount = computed(() => this.rows()?.length)
  protected rows = computed(() => {
    const stats = this.mannequin.modCraftGS()
    return Object.entries(stats || {})
      .map(([key, entry]) => {
        return {
          category: key,
          min: entry.min,
          max: entry.max,
        }
      })
      .filter((it) => !!(it.min.value || it.max.value))
  })
}
