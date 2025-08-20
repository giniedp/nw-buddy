import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { groupBy, sumBy } from 'lodash'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult } from '~/nw/mannequin/modifier'
import { damageTypeIcon } from '~/nw/weapon-types'
import { TooltipModule } from '~/ui/tooltip'
import { FlashDirective } from './ui/flash.directive'
import { ModifierTipComponent } from './ui/modifier-tip.component'

@Component({
  selector: 'nwb-gear-cell-mods-dmg',
  templateUrl: './gear-cell-mods-dmg.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class GearCellModsDmgComponent {
  private mannequin = inject(Mannequin)
  private dmgStats = this.mannequin.modDMG
  protected damageTypes = computed(() => {
    return collect(this.dmgStats()?.byDamageType)
  })
  protected vitalTypes = computed(() => {
    return collect(this.dmgStats()?.byVitalsType)
  })
  protected rowCount = computed(() => {
    return (this.damageTypes()?.length || 0) + (this.vitalTypes()?.length || 0)
  })
}

function collect(data: Record<string, ModifierResult>) {
  if (!data) {
    return null
  }
  const entires = Object.entries(data)
    .map(([key, entry]) => {
      return {
        category: key,
        source: entry.source,
        value: entry.value,
        capped: sumBy(entry.source, (it) => it.value * it.scale) > entry.value,
        icon: damageTypeIcon(key),
      }
    })
    .filter((it) => !!it.value)

  const groups = groupBy(entires, (it) => it.value)

  return Object.entries(groups).map(([value, entries]) => {
    return {
      value: Number(value),
      entries: entries,
      track: entries.map((it) => it.category).join(','),
    }
  })
}
