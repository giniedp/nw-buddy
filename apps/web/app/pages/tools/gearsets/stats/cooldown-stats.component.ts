import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { getAbilityCategoryTag } from '@nw-data/common'
import { NwDbService, NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { ModifierTipComponent } from './modifier-tip.component'
import { FlashDirective } from './utils/flash.directive'
import { LIST_COUNT_ANIMATION } from './utils/animation'
import { humanize } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-cooldown-stats',
  templateUrl: './cooldown-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ModifierTipComponent, TooltipModule, FlashDirective],
  animations: [LIST_COUNT_ANIMATION],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()'
  },
})
export class CooldownRedutionStatsComponent {

  private mannequin = inject(Mannequin)
  private db = inject(NwDbService)
  private cooldownMap = toSignal(this.db.cooldownsPlayerMap)
  private cooldownStats = toSignal(this.mannequin.statCooldown$)
  private activeAbilities = toSignal(this.mannequin.activeWeaponAbilities$)
  private abilities = computed(() => {
    const cooldowns = this.cooldownMap()
    const abilities = this.activeAbilities()
    if (!cooldowns || !abilities) {
      return []
    }
    return abilities.map((ability) => {
      return {
        cooldown: cooldowns.get(ability.AbilityID),
        ability: ability
      }
    }).filter((it) => !!it.cooldown?.Time)
  })
  protected rowCount = computed(() => this.rows()?.length)
  protected rows = computed(() => {
    const abilities = this.abilities()
    const stats = this.cooldownStats()
    if (!stats || !abilities) {
      return []
    }

    return abilities.map((it) => {
      return{
        label: it.ability.DisplayName,
        icon: it.ability.Icon,
        category: getAbilityCategoryTag(it.ability),
        cooldown: it.cooldown.Time,
        reductions: Object.entries(stats).map(([label, stat]) => {
          return {
            label: humanize(label),
            value: it.cooldown.Time * stat.value,
            mod: stat
          }
        })
      }
    })
  })

  protected modValue = signal({ group: '', value: 0})
  protected setMod(group: string, value: number) {
    this.modValue.set({ group, value })
  }
}
