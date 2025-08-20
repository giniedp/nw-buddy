import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { StatusEffectCategory } from '@nw-data/generated'
import { groupBy } from 'lodash'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult } from '~/nw/mannequin/modifier'
import { statusEffectCategoryIcon } from '~/nw/weapon-types'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'
import { FlashDirective } from './ui/flash.directive'
import { ModifierTipComponent } from './ui/modifier-tip.component'

@Component({
  selector: 'nwb-gear-cell-mods-duration',
  templateUrl: './gear-cell-mods-duration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class GearCellModsDurationComponent {
  private mannequin = inject(Mannequin)
  protected rowCount = computed(() => this.mods()?.length)
  protected mods = computed(() => {
    return selectMods(this.mannequin.modEffectReduction())
  })

  protected seconds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40]
}

interface Entry {
  name: string
  value: number
  icon: string
  mod: ModifierResult
}

function selectMods(mods: Partial<Record<StatusEffectCategory, ModifierResult>>) {
  const items = Object.entries(mods || {})
    .map(([key, value]) => {
      return {
        name: humanize(key),
        value: value.value,
        mod: value,
        icon: statusEffectCategoryIcon(key),
      }
    })
    .filter((it) => it.mod.value)
  const groups = groupBy(items, (it) => it.value)
  return Object.entries(groups).map(([value, entries]) => {
    return {
      value: Number(value),
      entries: entries,
      track: entries.map((it) => it.name).join(','),
    }
  })
}
