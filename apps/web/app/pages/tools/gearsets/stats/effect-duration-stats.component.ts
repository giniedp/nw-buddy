import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, computed, inject } from '@angular/core'
import { StatusEffectCategory } from '@nw-data/generated'
import { map, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult } from '~/nw/mannequin/modifier'
import { statusEffectCategoryIcon } from '~/nw/weapon-types'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, selectSignal, tapDebug } from '~/utils'
import { ModifierTipComponent } from './modifier-tip.component'
import { groupBy } from 'lodash'
import { FlashDirective } from './utils/flash.directive'
import { LIST_COUNT_ANIMATION } from './utils/animation'

@Component({
  standalone: true,
  selector: 'nwb-effect-duration-stats',
  templateUrl: './effect-duration-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
  animations:[
    LIST_COUNT_ANIMATION
  ]
})
export class EffectDurationStatsComponent {

  private mannequin = inject(Mannequin)
  protected rowCount = computed(() => this.mods()?.length)
  protected mods = selectSignal({
    mods: this.mannequin.statEffectReduction$
  }, (({ mods }) => {
    return selectMods(mods)
  }))

  protected seconds = [
    1,2,3,4,5,6,7,8,9,10,12, 15,20,25,30,40
  ]
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
