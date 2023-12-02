import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { VitalDetailStore } from './vital-detail.store'
import { TooltipModule } from '~/ui/tooltip'
import { RouterLink } from '@angular/router'
import { StatusEffectDetailModule } from '../status-effect-detail'
import { AbilityDetailModule } from '../ability-detail'

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
  protected buffs = toSignal(this.store.mutaBuffs$)
  protected effects = computed(() => {
    return this.buffs()?.effects?.map((it) => {
      return {
        id: it.StatusID,
        icon: it.PlaceholderIcon || NW_FALLBACK_ICON,
        label: it.DisplayName || it.StatusID,
        text: it.Description || (it.DisplayName ? `${it.StatusID}_Tooltip` : ''),
      }
    })
  })

  protected abilities = computed(() => {
    return this.buffs()?.abilities?.map((it) => {
      return {
        id: it.AbilityID,
        icon: it.Icon || NW_FALLBACK_ICON,
        label: it.DisplayName || it.AbilityID,
      }
    })
  })
}
