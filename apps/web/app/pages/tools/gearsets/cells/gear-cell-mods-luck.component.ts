import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { FlashDirective } from './ui/flash.directive'
import { ModifierTipComponent } from './ui/modifier-tip.component'

@Component({
  selector: 'nwb-gear-cell-mods-luck',
  templateUrl: './gear-cell-mods-luck.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class GearCellModsLuckComponent {
  private mannequin = inject(Mannequin)
  protected rowCount = computed(() => this.rows()?.length)
  protected rows = computed(() => {
    const stats = this.mannequin.modROL()
    return Object.entries(stats || {})
      .map(([key, entry]) => {
        return {
          category: key,
          source: entry.source,
          value: entry.value,
        }
      })
      .filter((it) => !!it.value)
  })
}
