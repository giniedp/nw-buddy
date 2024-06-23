import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'
import { AbilityDetailModule } from '../ability-detail'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-buffs',
  templateUrl: './vital-detail-buffs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, RouterLink, StatusEffectDetailModule, AbilityDetailModule],
  host: {
    class: 'flex flex-col gap-2 leading-tight',
  },
})
export class VitalDetailBuffsComponent {
  private store = inject(VitalDetailStore)

  protected buffs = toSignal(this.store.buffs$)
  protected effects = computed(() => {
    return this.buffs()
      ?.filter((it) => it.effect)
      .map(({ effect, chance, odd }) => {
        return {
          id: effect.StatusID,
          icon: effect.PlaceholderIcon || NW_FALLBACK_ICON,
          label: effect.DisplayName || humanize(effect.StatusID),
          text: effect.Description || (effect.DisplayName ? `${effect.StatusID}_Tooltip` : ''),
          chance: chance,
          odd: odd,
        }
      })
  })

  protected abilities = computed(() => {
    return this.buffs()
      ?.filter((it) => it.ability)
      .map(({ ability, chance, odd }) => {
        return {
          id: ability.AbilityID,
          icon: ability.Icon || NW_FALLBACK_ICON,
          label: ability.DisplayName || ability.AbilityID,
          chance: chance,
          odd: odd,
        }
      })
  })
}
